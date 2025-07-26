import { Document, Page, Text, View } from "@react-pdf/renderer";
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

// PDF Report Component for Document Analysis
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
