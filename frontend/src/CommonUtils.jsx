import { Document, Text, View, Page } from "@react-pdf/renderer";

/**
 * Prompt types for different AI models
 */
export const PROMPT_TYPES = [
  "Mistral",
  "LLAMA3",
  "Granite",
  "Qwen3",
  "SystemUserAssistant",
  "DeepSeekQwen",
  "FeeForm",
  "Gemma",
  "GPTOSS",
  "OLMO"
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
    "Employment",
    "Healthcare",
    "Taxation",
    "Securities",
    "Real estate",
    "Wills",
    "Trusts",
    "Probate",
    "Criminal defense",
    "Personal injury",

    // International Trade Keywords
    "WTO",
    "World Trade Organization",
    "GATT",
    "Tariff",
    "Customs",
    "Import",
    "Export",
    "Trade barrier",
    "Non-tariff barrier",
    "Quota",
    "Anti-dumping",
    "Countervailing duty",
    "Safeguard measures",
    "Trade remedy",
    "Rules of origin",
    "Free trade agreement",
    "FTA",
    "NAFTA",
    "USMCA",
    "TPP",
    "Bilateral trade",
    "Multilateral trade",
    "Most favored nation",
    "MFN",
    "National treatment",
    "Trade sanctions",
    "Economic sanctions",
    "OFAC",
    "Export control",
    "Export license",
    "Dual-use technology",
    "Embargo",
    "Trade war",
    "Trade deficit",
    "Trade surplus",
    "Balance of payments",
    "Currency manipulation",
    "Dumping",
    "Subsidy",
    "Trade dispute",
    "WTO panel",
    "Appellate Body",
    "Trade negotiation",
    "Trade promotion authority",
    "TPA",
    "Fast track",
    "Trade adjustment assistance",
    "TAA",
    "Customs valuation",
    "Harmonized system",
    "HS code",
    "Certificate of origin",
    "Letter of credit",
    "International commercial terms",
    "Incoterms",
    "Force majeure",
    "Trade finance",
    "Documentary collection",
    "Trade facilitation",
    "Customs union",
    "Common market",
    "Preferential trade",
    "Regional trade agreement",
    "RTA",
    "Trade bloc",

    // Presidential Powers Keywords
    "Posse Comitatus Act",
    "Executive power",
    "Presidential authority",
    "Commander-in-Chief",
    "Executive order",
    "Presidential directive",
    "Executive privilege",
    "War powers",
    "War Powers Resolution",
    "National emergency",
    "Emergency powers",
    "Stafford Act",
    "National Emergencies Act",
    "International Emergency Economic Powers Act",
    "IEEPA",
    "Take Care Clause",
    "Faithful execution",
    "Appointment power",
    "Recess appointment",
    "Senate confirmation",
    "Advice and consent",
    "Removal power",
    "Independent agency",
    "Unitary executive",
    "Presidential immunity",
    "Executive immunity",
    "Presidential pardon",
    "Clemency",
    "Commutation",
    "Foreign affairs power",
    "Treaty power",
    "Executive agreement",
    "Diplomatic recognition",
    "State secrets privilege",
    "National security",
    "Classification authority",
    "Youngstown framework",
    "Separation of powers",
    "Checks and balances",
    "Congressional oversight",
    "Impeachment",
    "25th Amendment",
    "Presidential succession",
    "Vesting Clause",
    "Presidential memorandum",
    "Signing statement",
    "Pocket veto",
    "Line-item veto",
    "Executive branch",
    "Cabinet",
    "White House",
    "Office of Legal Counsel",
    "OLC",
    "Presidential records",
    "Presidential Records Act",

    // Rights Keywords (Additional)
    "Civil rights",
    "Civil liberties",
    "Constitutional rights",
    "Fundamental rights",
    "Bill of Rights",
    "First Amendment",
    "Free speech",
    "Freedom of religion",
    "Establishment Clause",
    "Free Exercise Clause",
    "Freedom of press",
    "Freedom of assembly",
    "Right to petition",
    "Second Amendment",
    "Right to bear arms",
    "Third Amendment",
    "Fourth Amendment",
    "Search and seizure",
    "Warrant requirement",
    "Probable cause",
    "Reasonable suspicion",
    "Exclusionary rule",
    "Privacy rights",
    "Fifth Amendment",
    "Due process",
    "Self-incrimination",
    "Double jeopardy",
    "Takings Clause",
    "Eminent domain",
    "Sixth Amendment",
    "Right to counsel",
    "Speedy trial",
    "Public trial",
    "Jury trial",
    "Confrontation Clause",
    "Seventh Amendment",
    "Eighth Amendment",
    "Cruel and unusual punishment",
    "Excessive bail",
    "Excessive fines",
    "Ninth Amendment",
    "Unenumerated rights",
    "Tenth Amendment",
    "Reserved powers",
    "Fourteenth Amendment",
    "Equal protection",
    "Substantive due process",
    "Procedural due process",
    "Incorporation doctrine",
    "Voting rights",
    "Voting Rights Act",
    "Suffrage",
    "Disenfranchisement",
    "Redistricting",
    "Gerrymandering",
    "One person one vote",
    "Strict scrutiny",
    "Intermediate scrutiny",
    "Rational basis",
    "Protected class",
    "Suspect classification",
    "Discrimination",
    "Racial discrimination",
    "Gender discrimination",
    "Sexual orientation",
    "LGBTQ rights",
    "Disability rights",
    "ADA",
    "Religious accommodation",
    "Conscientious objector",
    "Miranda rights",
    "Habeas corpus",
    "Writ of habeas corpus",

    // Immigration Keywords (Expanded)
    "Immigration law",
    "Immigration and Nationality Act",
    "INA",
    "Department of Homeland Security",
    "DHS",
    "Immigration and Customs Enforcement",
    "ICE",
    "Customs and Border Protection",
    "CBP",
    "U.S. Citizenship and Immigration Services",
    "USCIS",
    "Immigration court",
    "Immigration judge",
    "Board of Immigration Appeals",
    "BIA",
    "Removal proceedings",
    "Deportation",
    "Expedited removal",
    "Voluntary departure",
    "Relief from removal",
    "Cancellation of removal",
    "Adjustment of status",
    "Asylum",
    "Refugee",
    "Persecution",
    "Particular social group",
    "Political opinion",
    "Well-founded fear",
    "Credible fear",
    "Reasonable fear",
    "Withholding of removal",
    "Convention Against Torture",
    "CAT",
    "Temporary protected status",
    "TPS",
    "DACA",
    "Deferred action",
    "Prosecutorial discretion",
    "Priority enforcement",
    "Detention",
    "Immigration detention",
    "Bond hearing",
    "Mandatory detention",
    "Prolonged detention",
    "Family detention",
    "Unaccompanied minor",
    "UAC",
    "Family separation",
    "Zero tolerance",
    "Remain in Mexico",
    "MPP",
    "Metering",
    "Safe third country",
    "Dublin Regulation",
    "Non-refoulement",
    "Green card",
    "Permanent resident",
    "LPR",
    "Conditional residence",
    "Naturalization",
    "Citizenship test",
    "Oath of allegiance",
    "Denaturalization",
    "Derivative citizenship",
    "Birthright citizenship",
    "Jus soli",
    "Jus sanguinis",
    "Dual citizenship",
    "Family-based petition",
    "Immediate relative",
    "Preference category",
    "Per-country limit",
    "Priority date",
    "Visa bulletin",
    "Employment-based",
    "Labor certification",
    "PERM",
    "H-1B",
    "L-1",
    "O-1",
    "TN",
    "E-1",
    "E-2",
    "F-1",
    "J-1",
    "B-1",
    "B-2",
    "Diversity visa",
    "DV lottery",
    "Consular processing",
    "National Visa Center",
    "NVC",
    "Administrative processing",
    "221(g)",
    "Public charge",
    "Affidavit of support",
    "Sponsor",
    "Inadmissibility",
    "Criminal grounds",
    "Health grounds",
    "Security grounds",
    "Fraud",
    "Misrepresentation",
    "Unlawful presence",
    "Three-year bar",
    "Ten-year bar",
    "Waiver",
    "I-601",
    "I-601A",
    "Provisional waiver",
    "Border wall",
    "Border security",
    "Sanctuary city",
    "Sanctuary jurisdiction",
    "287(g)",
    "Secure Communities",
    "E-Verify",
    "Worksite enforcement",
    "I-9",
    "Document fraud",
    "Human trafficking",
    "Smuggling",
    "Coyote",
    "Appropriation",
    "Appropriations",
    "Appropriations Act",
    "Continuing resolution",
    "CR",
    "Omnibus appropriations",
    "Supplemental appropriations",
    "Budget authority",
    "Discretionary spending",
    "Mandatory spending",
    "Authorization",
    "Authorization act",
    "Budget resolution",
    "Spending cap",
    "Sequestration",
    "Earmark",
    "Line item",
    "Pay-as-you-go",
    "PAYGO",
    "Scorekeeping",
    "Outlay",
    "Obligation",
    "Congressional Budget Office",
    "CBO",
    "Appropriations committee",
    "Budget committee",
    "Fiscal year",
    "Continuing appropriations",
    "Program level funding",
    "Budget enforcement",
    "Reconciliation bill",
    "Rescission",
    "Sequester"
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

    // International Trade Analysis
    "International Trade Law Review":
        "Analyze trade agreements, customs regulations, tariff classifications, and compliance with international trade laws including WTO obligations.",
    "Trade Sanctions Analysis":
        "Examine economic sanctions, export controls, OFAC compliance, and international embargo provisions affecting trade operations.",
    "Cross-Border Transaction Review":
        "Review international commercial transactions, letters of credit, shipping terms, and dispute resolution mechanisms in global trade.",
    "Trade Remedy Analysis":
        "Analyze anti-dumping duties, countervailing measures, safeguard actions, and trade remedy procedures under domestic and international law.",
    "Customs and Border Protection Review":
        "Examine customs valuation, classification disputes, country of origin determinations, and border enforcement issues.",
    "Free Trade Agreement Analysis":
        "Review FTA provisions, rules of origin, preferential tariff treatment, and compliance requirements under bilateral and multilateral trade agreements.",

    // Presidential Powers Analysis
    "Executive Powers Analysis":
        "Examine the scope and limits of presidential executive powers, including emergency authorities, executive orders, and constitutional constraints.",
    "Commander-in-Chief Review":
        "Analyze military authority, war powers, deployment of forces, and congressional authorization requirements for military action.",
    "Executive Privilege Assessment":
        "Review claims of executive privilege, presidential communications, national security implications, and congressional oversight authority.",
    "Appointment Powers Analysis":
        "Examine presidential nomination and appointment authority, Senate confirmation requirements, and recess appointment powers.",
    "Pardon and Clemency Review":
        "Analyze presidential pardon power, clemency decisions, constitutional limits, and procedural requirements for executive mercy.",
    "Emergency Powers Analysis":
        "Review presidential emergency declarations, statutory authorities, constitutional constraints, and congressional oversight of emergency powers.",
    "Foreign Affairs Authority Review":
        "Examine presidential foreign policy powers, treaty negotiation, diplomatic recognition, and congressional role in foreign affairs.",

    // Rights Analysis (Additional)
    "Voting Rights Analysis":
        "Examine voting rights protections, electoral processes, redistricting issues, and compliance with the Voting Rights Act and constitutional guarantees.",
    "Privacy Rights Review":
        "Analyze privacy expectations, data protection, surveillance issues, and Fourth Amendment protections in digital and physical contexts.",
    "Religious Freedom Analysis":
        "Review Free Exercise and Establishment Clause issues, religious accommodation requirements, and conflicts between religious liberty and civil rights.",
    "Equal Protection Review":
        "Examine discriminatory treatment, protected class analysis, strict scrutiny standards, and constitutional equality principles.",
    "Substantive Due Process Analysis":
        "Review fundamental rights, liberty interests, government intrusion on personal autonomy, and constitutional protection of life, liberty, and property.",
    "Procedural Rights Assessment":
        "Analyze fair hearing requirements, notice provisions, right to counsel, and procedural due process protections in administrative and judicial proceedings.",
    "Free Speech and Expression Review":
        "Examine First Amendment protections, content-based restrictions, time-place-manner regulations, and balancing tests for speech limitations.",
    // Government Appropriations & Budget Analysis (New)
    "Appropriations Overview":
        "Analyze the document as an appropriations or budget-related measure. Identify accounts, programs, and agencies affected; the type of funding (discretionary vs. mandatory); time limits on availability; and any notable riders or conditions on the use of funds.",
    "Line-Item Funding Analysis":
        "Break down the specific line-item appropriations in this document, summarizing the amount, purpose, agency or account, period of availability, and any matching or cost-sharing requirements.",
    "Appropriations Compliance Review":
        "Assess the document for compliance with core appropriations law principles, such as purpose, time, and amount restrictions, and flag any provisions that may raise Anti-Deficiency Act or reprogramming concerns.",
    "Continuing Resolution Impact":
        "Explain how this document functions as, or interacts with, a continuing resolution. Identify what funding is extended, at what rate, what programs are newly funded or excluded, and any special anomalies or exceptions.",
    "Authorization vs Appropriation Analysis":
        "Analyze how this document’s appropriations relate to underlying authorizing statutes, highlighting any gaps, expired authorizations, deviations from authorized amounts, or provisions that effectively create new authorizations through appropriations.",
    "Programmatic Funding Trends":
        "Using the information in this document, describe funding trends for the major programs and accounts it covers, including increases or decreases relative to prior levels and any stated policy rationales.",
    "Earmark and Directed Spending Review":
        "Identify any earmarks, congressionally directed spending, or project-specific funding in the document. Summarize the beneficiaries, purposes, and any reporting or oversight requirements associated with these items.",
    "State and Local Government Impact":
        "Analyze how the appropriations and conditions in this document impact state, local, tribal, or territorial governments, including pass-through funding, grant conditions, maintenance-of-effort requirements, and potential unfunded mandates.",
// General Document Analysis (New)
    "General Document Overview":
        "Provide a clear, structured overview of this document, identifying its purpose, main topics, key parties, and any time-sensitive obligations or deadlines.",
    "Key Issues and Questions":
        "Identify the principal legal and factual issues raised in this document and propose specific questions that a practitioner or policymaker should consider.",
    "Red Flag Screening":
        "Scan the document for potential red flags, including ambiguous language, missing definitions, inconsistent terminology, or provisions that may create significant legal, financial, or operational risk.",
    "Definitions and Terms Mapping":
        "Extract and summarize defined terms and specialized terminology in this document, mapping each definition to where and how it is used in the text.",
    "Procedural Posture Summary":
        "Explain the procedural posture reflected in this document, including what has already happened, what is being requested, and what the next procedural steps are likely to be.",
    // Immigration Law (Expanded)
    "Deportation and Removal Analysis":
        "Analyze removal proceedings, grounds for deportation, relief from removal, and due process protections in immigration enforcement.",
    "Asylum and Refugee Law Review":
        "Examine asylum claims, refugee status determinations, persecution standards, and international protection obligations.",
    "Family Immigration Analysis":
        "Review family-based petitions, marriage fraud investigations, derivative status, and reunification policies under immigration law.",
    "Employment-Based Immigration Review":
        "Analyze work authorization, labor certification, specialty occupation requirements, and employer compliance with immigration laws.",
    "Citizenship and Naturalization Analysis":
        "Examine pathways to citizenship, naturalization requirements, denaturalization procedures, and birthright citizenship issues.",
    "Immigration Detention Review":
        "Analyze detention authority, bond determinations, prolonged detention issues, and constitutional constraints on immigration custody.",
    "DACA and Deferred Action Analysis":
        "Review deferred action policies, prosecutorial discretion, work authorization, and constitutional challenges to immigration enforcement priorities.",
    "Border Security and Enforcement Review":
        "Examine border control measures, expedited removal, credible fear determinations, and enforcement priorities at ports of entry."
};

/**
 * Chat Controller Hook - Provides a unified interface for chat operations
 * This hook manages chat state, settings, and provides functions for message handling
 *
 * @param {string} scope - The scope identifier for this chat instance (default: "default")
 * @returns {Object} Chat controller object with methods and state
 */

export const PDFReportDocument = ({ reportData }) => (
  <Document>
    <Page
      size="A4"
      style={{
        fontFamily: "Helvetica",
        fontSize: 10,
        padding: 30,
        lineHeight: 1.6,
      }}
    >
      {/* Header Section */}
      <View
        style={{
          marginBottom: 20,
          borderBottom: "1px solid #ccc",
          paddingBottom: 10,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 8,
          }}
        >
          Legal Document Analysis Report
        </Text>
        <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
          Document ID: {reportData.documentId}
        </Text>
        <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
          Index: {reportData.indexName}
        </Text>
        <Text style={{ fontSize: 10, color: "#666" }}>
          Generated: {new Date().toLocaleString()}
        </Text>
      </View>

      {/* Analysis Overview */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 10,
          }}
        >
          Analysis Overview
        </Text>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#555" }}>
            Prompt Type: {reportData.promptType}
          </Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#555" }}>
            Processing Time: {(reportData.processTime / 1000).toFixed(2)}s
          </Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#555" }}>
            Created: {new Date(reportData.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Document Query */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 10,
          }}
        >
          Document Query
        </Text>
        <View
          style={{
            backgroundColor: "#f5f5f5",
            padding: 10,
            borderRadius: 4,
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "bold",
              color: "#555",
              marginBottom: 5,
            }}
          >
            Embed Prompt:
          </Text>
          <Text style={{ fontSize: 10, color: "#333", lineHeight: 1.4 }}>
            {reportData.embedPrompt}
          </Text>
        </View>
        <View
          style={{ backgroundColor: "#f5f5f5", padding: 10, borderRadius: 4 }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "bold",
              color: "#555",
              marginBottom: 5,
            }}
          >
            Document Prompt:
          </Text>
          <Text style={{ fontSize: 10, color: "#333", lineHeight: 1.4 }}>
            {reportData.docPrompt}
          </Text>
        </View>
      </View>

      {/* Keywords Section */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 10,
          }}
        >
          Key Legal Terms
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          {reportData.keywords &&
            reportData.keywords.map((keyword, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: "#e3f2fd",
                  padding: 4,
                  borderRadius: 3,
                  marginRight: 4,
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{ fontSize: 9, color: "#1976d2", fontWeight: "bold" }}
                >
                  {keyword}
                </Text>
              </View>
            ))}
        </View>
      </View>

      {/* Analysis Response */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 10,
          }}
        >
          Legal Analysis Response
        </Text>
        <View
          style={{ backgroundColor: "#f9f9f9", padding: 12, borderRadius: 4 }}
        >
          <Text style={{ fontSize: 10, color: "#333", lineHeight: 1.5 }}>
            {reportData.response}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View
        style={{
          marginTop: 30,
          borderTop: "1px solid #ccc",
          paddingTop: 10,
        }}
      >
        <Text style={{ fontSize: 8, color: "#666", textAlign: "center" }}>
          Legal Document Analysis Report | Page 1 | ID: {reportData.id}
        </Text>
      </View>
    </Page>
  </Document>
);

// PDF Export Components
export const PDFExportDocument = ({ chatHistory, documentTitle }) => (
  <Document>
    <Page
      size="A4"
      style={{
        fontFamily: "Helvetica",
        fontSize: 11,
        padding: 30,
        lineHeight: 1.6,
      }}
    >
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
          Chat Session Export
        </Text>
        <Text style={{ fontSize: 12, color: "#666", marginBottom: 5 }}>
          Document: {documentTitle || "Unknown Document"}
        </Text>
        <Text style={{ fontSize: 10, color: "#666" }}>
          Exported on: {new Date().toLocaleString()}
        </Text>
      </View>

      {chatHistory &&
        chatHistory.map((message, index) => (
          <View key={message.id || index} style={{ marginBottom: 15 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "bold",
                color: message.sender === "user" ? "#0066cc" : "#333",
                marginBottom: 5,
              }}
            >
              {message.sender === "user" ? "User" : "Assistant"} -{" "}
              {new Date(message.timestamp).toLocaleString()}
            </Text>
            <Text
              style={{
                fontSize: 11,
                marginLeft: 10,
              }}
            >
              {message.content}
            </Text>
            {message.processTime && (
              <Text
                style={{
                  fontSize: 9,
                  color: "#666",
                  marginLeft: 10,
                  fontStyle: "italic",
                }}
              >
                Processing time: {(message.processTime / 1000).toFixed(1)}s
              </Text>
            )}
          </View>
        ))}
    </Page>
  </Document>
);

// Extracted PDF component for better separation of concerns
export const PDFConversationDocument = ({ chatHistory, documentTitle }) => (
  <Document>
    <Page
      size="A4"
      style={{
        fontFamily: "Helvetica",
        fontSize: 10,
        padding: 30,
        lineHeight: 1.6,
      }}
    >
      {/* Header Section */}
      <View
        style={{
          marginBottom: 20,
          borderBottom: "2px solid #333",
          paddingBottom: 15,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 8,
          }}
        >
          Inference Export
        </Text>
        <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
          Document: {documentTitle || "Unknown Document"}
        </Text>
        <Text style={{ fontSize: 10, color: "#666" }}>
          Exported: {new Date().toLocaleString()}
        </Text>
      </View>

      {/* Session Summary */}
      <View
        style={{
          marginBottom: 20,
          backgroundColor: "#f8f9fa",
          padding: 12,
          borderRadius: 4,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 8,
          }}
        >
          Session Summary
        </Text>
        <View
          style={{ display: "flex", flexDirection: "row", marginBottom: 4 }}
        >
          <Text style={{ fontSize: 10, color: "#555", width: "30%" }}>
            Total Messages:
          </Text>
          <Text style={{ fontSize: 10, color: "#333" }}>
            {chatHistory.length}
          </Text>
        </View>
        <View
          style={{ display: "flex", flexDirection: "row", marginBottom: 4 }}
        >
          <Text style={{ fontSize: 10, color: "#555", width: "30%" }}>
            User Messages:
          </Text>
          <Text style={{ fontSize: 10, color: "#333" }}>
            {chatHistory.filter((msg) => msg.sender === "user").length}
          </Text>
        </View>
        <View
          style={{ display: "flex", flexDirection: "row", marginBottom: 4 }}
        >
          <Text style={{ fontSize: 10, color: "#555", width: "30%" }}>
            Assistant Responses:
          </Text>
          <Text style={{ fontSize: 10, color: "#333" }}>
            {chatHistory.filter((msg) => msg.sender === "assistant").length}
          </Text>
        </View>
        {chatHistory.length > 0 && (
          <View style={{ display: "flex", flexDirection: "row" }}>
            <Text style={{ fontSize: 10, color: "#555", width: "30%" }}>
              Session Started:
            </Text>
            <Text style={{ fontSize: 10, color: "#333" }}>
              {new Date(chatHistory[0].timestamp).toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Conversation Messages */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 15,
          }}
        >
          Conversation History
        </Text>
        {chatHistory.map((message, index) => (
          <View key={message.id || index} style={{ marginBottom: 20 }}>
            {/* Message Header */}
            <View
              style={{
                backgroundColor:
                  message.sender === "user" ? "#e3f2fd" : "#f5f5f5",
                padding: 8,
                borderRadius: 4,
                borderBottom: "1px solid #ddd",
              }}
            >
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "bold",
                    color: message.sender === "user" ? "#1976d2" : "#333",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {message.sender === "user" ? "User" : "Assistant"}
                </Text>
                <Text style={{ fontSize: 9, color: "#666" }}>
                  {new Date(message.timestamp).toLocaleString()}
                </Text>
              </View>
              {message.processTime && (
                <Text
                  style={{
                    fontSize: 8,
                    color: "#666",
                    fontStyle: "italic",
                    marginTop: 2,
                  }}
                >
                  Processing time: {(message.processTime / 1000).toFixed(2)}s
                </Text>
              )}
            </View>

            {/* Message Content */}
            <View
              style={{
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderTop: "none",
                padding: 12,
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: "#333",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {message.content}
              </Text>
            </View>

            {/* Keywords if available */}
            {message.keywords && message.keywords.length > 0 && (
              <View
                style={{
                  marginTop: 8,
                  padding: 8,
                  backgroundColor: "#f8f9fa",
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "bold",
                    color: "#555",
                    marginBottom: 4,
                  }}
                >
                  Keywords:
                </Text>
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 4,
                  }}
                >
                  {message.keywords.map((keyword, idx) => (
                    <View
                      key={idx}
                      style={{
                        backgroundColor: "#e3f2fd",
                        padding: "2px 6px",
                        borderRadius: 2,
                        marginRight: 3,
                        marginBottom: 2,
                      }}
                    >
                      <Text style={{ fontSize: 8, color: "#1976d2" }}>
                        {keyword}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Footer */}
      <View
        style={{
          position: "absolute",
          bottom: 20,
          left: 30,
          right: 30,
          borderTop: "1px solid #ccc",
          paddingTop: 10,
        }}
      >
        <Text style={{ fontSize: 8, color: "#666", textAlign: "center" }}>
          Legal Document Conversation Export | Generated:{" "}
          {new Date().toLocaleString()}
        </Text>
      </View>
    </Page>
  </Document>
);
