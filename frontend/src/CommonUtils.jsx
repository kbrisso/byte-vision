// common.jsx

/**
 * Prompt types for different AI models
 */
export const PROMPT_TYPES = [
  "LLAMA2",
  "LLAMA3",
  "Granite",
  "Qwen3",
  "SystemUserAssistant",
  "UserAssistantDeepSeek",
  "FeeForm",
];

/**
 * Comprehensive list of legal keywords for document analysis
 */
export const LEGAL_KEYWORDS = [
  "Plaintiff",
  "Defendant",
  "Appellant",
  "Appellee",
  "Litigant",
  "Complainant",
  "Complaint",
  "Answer",
  "Pleading",
  "Affidavit",
  "Motion",
  "Brief",
  "Subpoena",
  "Summons",
  "Jurisdiction",
  "Action",
  "Damages",
  "Discovery",
  "Deposition",
  "Interrogatories",
  "Evidence",
  "Admissible",
  "Burden",
  "Proof",
  "Verdict",
  "Judgment",
  "Appeal",
  "Settlement",
  "Default",
  "Dismissal",
  "Contempt",
  "Arraignment",
  "Indictment",
  "Acquittal",
  "Plea",
  "Law",
  "Legal",
  "Statute",
  "Regulation",
  "Case",
  "Precedent",
  "Authority",
  "Constitutional",
  "Common law",
  "Civil",
  "Criminal",
  "Tort",
  "Contract",
  "Property",
  "Family",
  "Corporate",
  "Environmental",
  "Intellectual property",
  "Procedure",
  "Rights",
  "Obligation",
  "Remedy",
  "Liability",
  "Compliance",
  "Ethics",
  "Justice",
  "Court",
  "Judge",
  "Jury",
  "Attorney",
  "Lawyer",
  "Counsel",
  "Agency",
  "Legislature",
  "Congress",
  "State",
  "Federal",
  "Opinion",
  "Decision",
  "Record",
  "Code",
  "Annotated",
  "Reporter",
  "Digest",
  "Treatise",
  "Restatement",
  "Journal",
  "Law review",
  "Article",
  "Memorandum",
  "White paper",
  "Search",
  "Keyword",
  "Database",
  "Citator",
  "Shepard's",
  "KeyCite",
  "LexisNexis",
  "Westlaw",
  "Bloomberg Law",
  "Analysis",
  "Interpretation",
  "Validity",
  "History",
  "Source",
  "Primary",
  "Secondary",
  "Divorce",
  "Custody",
  "Bankruptcy",
  "Immigration",
  "Discrimination",
  "Employment",
  "Healthcare",
  "Taxation",
  "Securities",
  "Real estate",
  "Estate planning",
  "Wills",
  "Trusts",
  "Probate",
  "Criminal defense",
  "Personal injury",
  "Medical malpractice",
  "Product liability",
  "Workers' compensation",
];

/**
 * Predefined prompt types with their corresponding analysis templates
 * Used for legal document analysis and processing
 */
export const DOC_PROMPTS = {
  "Legal Analysis":
    "Analyze the legal complaint outlined in the court document.",
  "Contract Review":
    "Review the contract terms and identify key obligations, rights, and potential risks.",
  "Case Summary":
    "Provide a comprehensive summary of the case including key facts, legal issues, and outcomes.",
  "Regulatory Compliance":
    "Analyze the document for compliance with relevant regulations and identify any issues.",
  "Risk Assessment":
    "Identify and assess potential legal and business risks outlined in the document.",
  "Document Classification":
    "Classify and categorize the document based on its content and legal significance.",
  "Evidence Analysis":
    "Analyze the evidence presented in the document and its potential impact on the case.",
  "Policy Review":
    "Review the policy document and identify key provisions, requirements, and implications.",
  "Constitutional Analysis":
    "Examine the document for constitutional issues, rights violations, and constitutional principles at stake.",
  "Statutory Interpretation":
    "Analyze how statutes and laws apply to the facts presented in this document and interpret their meaning.",
  "Precedent Research":
    "Identify relevant case law, precedents, and legal authorities that apply to this matter.",
  "Due Process Review":
    "Evaluate whether proper due process procedures were followed and identify any procedural violations.",
  "Rights Assessment":
    "Analyze the constitutional and legal rights involved and determine if any rights have been violated or protected.",
  "Jurisdiction Analysis":
    "Examine jurisdictional issues, venue considerations, and determine the appropriate court or authority.",
  "Legal Standing":
    "Assess whether the parties have proper legal standing to bring or defend the claims presented.",
  "Damages Calculation":
    "Analyze the damages claimed, assess their validity, and evaluate potential compensation amounts.",
  "Discovery Issues":
    "Review discovery-related matters, including privilege claims, document production, and procedural compliance.",
  "Motion Analysis":
    "Examine the legal and factual basis for motions filed and assess their likelihood of success.",
  "Settlement Evaluation":
    "Assess the case for settlement potential, strengths, weaknesses, and negotiation strategies.",
  "Appeal Prospects":
    "Evaluate the document for potential appellate issues and assess the likelihood of successful appeal.",
  "Criminal Law Analysis":
    "Analyze criminal charges, defenses, sentencing guidelines, and constitutional protections.",
  "Civil Rights Review":
    "Examine civil rights violations, discrimination claims, and constitutional protections under federal and state law.",
  "Employment Law Analysis":
    "Review employment-related legal issues including discrimination, wrongful termination, and workplace rights.",
  "Corporate Governance":
    "Analyze corporate documents for governance issues, fiduciary duties, and regulatory compliance.",
  "Environmental Law Review":
    "Examine environmental regulations, compliance issues, and potential violations or liabilities.",
  "Intellectual Property Analysis":
    "Review IP-related documents for patent, trademark, copyright, or trade secret issues.",
  "Family Law Assessment":
    "Analyze family law matters including custody, divorce, support, and property division issues.",
  "Immigration Law Review":
    "Examine immigration documents for compliance with federal immigration law and procedural requirements.",
  "Tax Law Analysis":
    "Review tax-related documents for compliance with federal, state, and local tax obligations.",
  "Real Estate Law Review":
    "Analyze real estate documents for title issues, zoning compliance, and property rights.",
  "Bankruptcy Analysis":
    "Examine bankruptcy filings and documents for procedural compliance and debt discharge issues.",
  "Securities Law Review":
    "Analyze securities-related documents for compliance with federal and state securities regulations.",
  "Healthcare Law Analysis":
    "Review healthcare documents for HIPAA compliance, medical malpractice issues, and regulatory requirements.",
  "First Amendment Analysis":
    "Examine the document for First Amendment free speech, religion, press, and assembly issues.",
  "Fourth Amendment Review":
    "Analyze search and seizure issues, warrant requirements, and privacy rights violations.",
  "Fifth Amendment Analysis":
    "Review due process, self-incrimination, double jeopardy, and takings clause issues.",
  "Fourteenth Amendment Review":
    "Examine equal protection, due process, and civil rights issues under the Fourteenth Amendment.",
  "Commerce Clause Analysis":
    "Analyze federal and state authority issues under the Commerce Clause of the Constitution.",
  "Federalism Issues":
    "Examine the balance of federal and state powers and potential constitutional conflicts.",
  "Separation of Powers":
    "Analyze the document for issues related to the separation of executive, legislative, and judicial powers.",
};

/**
 * Helper function to get all prompt type keys
 * @returns {string[]} Array of prompt type names
 */
export const getDocPromptsKeys = () => Object.keys(DOC_PROMPTS);

/**
 * Helper function to get prompt template by type
 * @param {string} type - The prompt type
 * @returns {string} The corresponding prompt template
 */
export const getDocPrompts = (type) => DOC_PROMPTS[type] || "";

/**
 * Helper function to check if a prompt type exists
 * @param {string} type - The prompt type to check
 * @returns {boolean} Whether the prompt type exists
 */
export const isValidDocPrompts = (type) => type in DOC_PROMPTS;
