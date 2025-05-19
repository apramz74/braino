# BrainTwo - AI-Powered Product Scope Brainstorming Tool

BrainTwo is a React application that helps Product Managers brainstorm and iterate on scope ideas for new features. It uses OpenAI's API to generate interactive idea cards that can be saved or dismissed.

## Features

- Generate ideas for product features using AI
- Categorize ideas into use cases, features, and considerations
- Interactive UI to save or dismiss ideas
- Track saved ideas for reference
- Save templates and document history in Supabase

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory and add your API keys:

   ```
   REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
   REACT_APP_SUPABASE_URL=your_supabase_url_here
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

   You can get an OpenAI API key from [OpenAI's platform](https://platform.openai.com/api-keys).
   For Supabase, create a free account at [Supabase](https://supabase.com) and create a new project.

4. Set up your Supabase database with the following tables:

   **templates** table:

   - id (uuid, primary key)
   - name (text, not null)
   - description (text)
   - content (text, not null)
   - created_at (timestamp with time zone, default: now())
   - updated_at (timestamp with time zone)

   **document_history** table:

   - id (uuid, primary key)
   - title (text, not null)
   - content (text, not null)
   - template_id (text, not null)
   - created_at (timestamp with time zone, default: now())

5. Start the development server:
   ```
   npm start
   ```

## How to Use

1. Enter a description of the feature or product you're scoping in the text area
2. Click "Generate Ideas" to receive AI-generated brainstorming suggestions
3. Review the generated ideas in the cards below
4. Dismiss ideas you don't want to keep, or save them to your saved ideas section
5. Iterate on the prompt to explore different aspects of your feature
6. Create and save custom templates for your documentation needs
7. Save generated documents to your history for future reference

## Environment Variables

- `REACT_APP_OPENAI_API_KEY`: Your OpenAI API key (required)
- `REACT_APP_SUPABASE_URL`: Your Supabase project URL (required for database features)
- `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anonymous key (required for database features)

## Technologies Used

- React
- TypeScript
- OpenAI API
- Supabase

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## License

MIT
