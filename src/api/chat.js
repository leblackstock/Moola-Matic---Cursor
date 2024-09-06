import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const ASSISTANT_ID = 'asst_4nMAXSwdqUcvfzfiYlBdzfYO';

const handleImageUpload = async (imageFile) => {
  if (!(imageFile instanceof File)) {
    throw new Error('Invalid image file');
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(imageFile.type)) {
    throw new Error('Unsupported image format. Please use JPEG, PNG, GIF, or WEBP.');
  }

  // Check file size (max 20MB)
  const maxSize = 20 * 1024 * 1024; // 20MB in bytes
  if (imageFile.size > maxSize) {
    throw new Error('Image file is too large. Maximum size is 20MB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(imageFile);
  });
};

const handleImageUploadAndChat = async (imageFile, messages, onDataCallback) => {
  try {
    const imageUrl = await handleImageUpload(imageFile);
    console.log("Image encoded successfully, URL:", imageUrl);
    
    const promptText = "Please provide a detailed analysis of the item in the image by:\n" +
      "1. Identifying what it is and its primary function\n" +
      "2. Noting any historical or cultural significance, including makers, brands, or artists\n" +
      "3. Describing its materials, dimensions, and distinguishing features like markings or signatures\n" +
      "4. Assessing its condition, including damage, wear, restoration, and signs of authenticity such as patina or provenance\n" +
      "5. Evaluating the craftsmanship quality and design features like patterns or styles\n" +
      "6. Estimating its market value based on current trends and its condition\n" +
      "7. If the image contains mathematical content, please analyze or solve it\n" +
      "8. Provide feedback on how this item relates to case interviews, management consulting assessments, or problem-solving scenarios based on the conversation context\n\n" +
      "Ensure your analysis is comprehensive and covers all these aspects.";

    const updatedMessages = [
      ...messages,
      { 
        role: 'user', 
        content: [
          { type: 'text', text: 'Here is the image I uploaded:' },
          { 
            type: 'image_url', 
            image_url: { 
              url: imageUrl,
              detail: "high"
            } 
          }
        ]
      },
      { role: 'user', content: promptText }
    ];

    console.log("Sending updated messages to handleChatRequest:", JSON.stringify(updatedMessages, null, 2));
    return await handleChatRequest(updatedMessages, onDataCallback);
  } catch (error) {
    console.error('Error in handleImageUploadAndChat:', error);
    onDataCallback(`Sorry, an error occurred: ${error.message}`, true);
  }
};

async function handleChatRequest(messages, onDataCallback) {
  console.log("handleChatRequest function called");
  console.log("Messages:", JSON.stringify(messages, null, 2));

  const safeCallback = typeof onDataCallback === 'function' 
    ? onDataCallback 
    : (content, isComplete) => console.log('Received content:', content, 'Is complete:', isComplete);

    

  let accumulatedContent = '';

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages,
      max_tokens: 300,
      stream: true
    });

    for await (const chunk of response) {
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        accumulatedContent += content;
        safeCallback(content, false);
      }
    }

    console.log("Chat completion finished");
    safeCallback(accumulatedContent, true);
    return accumulatedContent;
  } catch (error) {
    console.error('OpenAI API error:', error);
    safeCallback(`Sorry, an error occurred: ${error.message}`, true);
    throw error;
  }
}

// Export all functions in a single export statement
export { handleChatRequest, handleImageUpload, handleImageUploadAndChat };
