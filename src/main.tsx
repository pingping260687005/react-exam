import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ModuleRegistry, AllCommunityModule, CheckboxEditorModule, ClientSideRowModelModule } from 'ag-grid-community'
import { SetFilterModule } from 'ag-grid-enterprise'
import './index.css'
import App from './App.tsx'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule, SetFilterModule, CheckboxEditorModule, ClientSideRowModelModule])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
