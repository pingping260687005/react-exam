import { AppProvider } from './context/AppProvider';
import QuoteTable from './components/QuoteTable';
import './App.css';

function App() {
  return (
    <AppProvider>
      <div className="app">
        <QuoteTable />
      </div>
    </AppProvider>
  );
}

export default App;
