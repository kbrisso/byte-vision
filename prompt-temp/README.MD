## Prompt Templates Directory
The folder stores template files that define how prompts are structured and formatted for different AI interactions within Byte-Vision. `prompt-temp`
### Purpose
- **Template Storage**: Contains reusable prompt templates for various AI operations
- **Standardization**: Ensures consistent prompt formatting across different features
- **Customization**: Allows users to modify how AI models are prompted for specific tasks

### Use Cases
- **Document Q&A Templates**: Structured prompts for asking questions about documents
- **Chat Interface Templates**: Formatted prompts for conversational AI interactions
- **System Prompts**: Base templates that define the AI's behavior and context
- **Task-Specific Prompts**: Specialized templates for OCR processing, document analysis, etc.

### Configuration
The prompt templates path is configured in your file: `byte-vision-cfg.env`
``` env
PromptTempPath=C:/Projects/byte-vision/prompt-temp/
```
### Benefits
- **Consistency**: Ensures all AI interactions use properly formatted prompts
- **Maintainability**: Easy to update prompt structures without code changes
- **Flexibility**: Users can customize AI behavior by modifying templates
- **Organization**: Keeps prompt logic separate from application code

### Example Usage
Templates might include structured formats for:
- Document context insertion
- Question formatting for RAG (Retrieval-Augmented Generation)
- System instructions for different AI models
- Response formatting guidelines

This folder is essential for Byte-Vision's AI functionality, as it defines how the application communicates with LlamaCpp models for document intelligence tasks like Q&A, chat, and document analysis.
