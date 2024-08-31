const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

class ApplicantsDatabase {
  constructor() {
    this.applicantDB = [];
    this.DbHeaders = ["Name", "Age", "YearsOfExperience", "Eligibility"];
  }

  // Register a new applicant
  async registerApplicant(data) {
    const applicant = {
      fullName: data.fullName,
      age: data.age,
      yearsOfExperience: data.yearsOfExperience,
      email: data.email,
      portfolioURL: data.portfolioURL,
      currentSalary: data.currentSalary,
      expectedSalary: data.expectedSalary,
      noticePeriod: data.noticePeriod,
    };
    this.applicantDB.push(applicant);
    console.log(`Applicant ${applicant.fullName} registered successfully.`);
    return "Application Successful, Proceed to check your Eligibility Status";
  }

  // Get the number of applicants
  async getNumberOfApplicants() {
    return this.applicantDB.length;
  }

  // Get metadata about the applicants
  async getApplicantsMetadata() {
    const numberOfApplicants = this.applicantDB.length;
    let numberOfEligibleApplicantsByAge = 0;
    let numberOfEligibleApplicantsByExperience = 0;

    for (let applicant of this.applicantDB) {
      if (applicant.age >= 18) {
        numberOfEligibleApplicantsByAge += 1;
      }
      if (applicant.yearsOfExperience >= 3) {
        numberOfEligibleApplicantsByExperience += 1;
      }
    }

    return `Out of ${numberOfApplicants} applicants that registered, ${numberOfEligibleApplicantsByAge} applicants meet the required age of 18 years and above and ${numberOfEligibleApplicantsByExperience} applicants have at least 3 years of experience which is also a requirement for Qualification to the next Stage.`;
  }

  // Get the number of applicants eligible by age
  async getApplicantsEligibleByAge() {
    let numberOfEligibleApplicantsByAge = 0;
    for (let applicant of this.applicantDB) {
      if (applicant.age >= 18) {
        numberOfEligibleApplicantsByAge += 1;
      }
    }
    return numberOfEligibleApplicantsByAge;
  }

  // Get the number of applicants eligible by experience
  async getApplicantsEligibleByExperience() {
    let numberOfEligibleApplicantsByExperience = 0;
    for (let applicant of this.applicantDB) {
      if (applicant.yearsOfExperience >= 3) {
        numberOfEligibleApplicantsByExperience += 1;
      }
    }
    return numberOfEligibleApplicantsByExperience;
  }

  // Generate eligibility list in CSV format
  async getEligibilityList() {
    let csvText = this.DbHeaders.join(",") + "\n";
    for (let applicant of this.applicantDB) {
      let eligibility = (applicant.age >= 18 && applicant.yearsOfExperience >= 3) 
        ? "Congratulations..! you are Eligible" 
        : "Sorry..! you are not Eligible";

      csvText += `${applicant.fullName},${applicant.age},${applicant.yearsOfExperience},${eligibility}\n`;
    }
    return csvText;
  }
}

const applicantsDatabase = new ApplicantsDatabase();

var handlers = {
  register_applicant: applicantsDatabase.registerApplicant.bind(applicantsDatabase),
  get_number_of_applicants: applicantsDatabase.getNumberOfApplicants.bind(applicantsDatabase),
  get_applicants_metadata: applicantsDatabase.getApplicantsMetadata.bind(applicantsDatabase),
  get_applicants_eligible_by_age: applicantsDatabase.getApplicantsEligibleByAge.bind(applicantsDatabase),
  get_applicants_eligible_by_experience: applicantsDatabase.getApplicantsEligibleByExperience.bind(applicantsDatabase),
  get_eligibility_list: applicantsDatabase.getEligibilityList.bind(applicantsDatabase),
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(finish),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();
