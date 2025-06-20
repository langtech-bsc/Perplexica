import { RunnableSequence, RunnableMap, RunnableLambda } from '@langchain/core/runnables';
import ListLineOutputParser from '../outputParsers/listLineOutputParser';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import formatChatHistoryAsString from '../utils/formatHistory';
import { BaseMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';

export const suggestionGeneratorPrompt = `
You are an AI suggestion generator for a search-powered chat assistant. Your task is to read the following conversation and generate **4–5 helpful and relevant follow-up questions or search suggestions** the user could ask next.

### Requirements:
- Suggestions must be clearly connected to the conversation topic.
- Each suggestion should be **medium-length**, informative, and ask for deeper insight or related facts.
- Do **not** generate greetings, acknowledgements, or vague replies (e.g., "Thanks for the info", "Interesting").
- Assume the user wants to continue learning or exploring more.

### Output format:
Wrap the suggestions inside these XML tags:
<suggestions>
Your first suggestion
Your second suggestion
...
</suggestions>

### Example:
<suggestions>
Tell me more about SpaceX’s recent missions  
What is the current valuation of SpaceX?  
How does SpaceX compare to Blue Origin?  
What rockets has SpaceX developed over the years?  
Who is leading the development of Starship?
</suggestions>

Now read the conversation below and generate the suggestions.
`;


type SuggestionGeneratorInput = {
  chat_history: BaseMessage[];
};

const outputParser = new ListLineOutputParser({
  key: 'suggestions',
});

const createSuggestionGeneratorChain = (llm: BaseChatModel) => {
  return RunnableSequence.from([
    RunnableMap.from({
      chat_history: (input: SuggestionGeneratorInput) =>
        formatChatHistoryAsString(input.chat_history),
    }),
     ChatPromptTemplate.fromMessages([
        ['system', suggestionGeneratorPrompt],
        ['user', '**Conversation:**\n<conversation>\n{chat_history}\n</conversation>'],
      ]),
    llm,
    outputParser,
  ]);
};

const generateSuggestions = (
  input: SuggestionGeneratorInput,
  llm: BaseChatModel,
) => {
  (llm as unknown as ChatOpenAI).temperature = 0;
  const suggestionGeneratorChain = createSuggestionGeneratorChain(llm);
  return suggestionGeneratorChain.invoke(input);
};

export default generateSuggestions;
