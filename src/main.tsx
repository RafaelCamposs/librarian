import { render } from 'preact'
import './index.css'
import { App } from './app.tsx'
import { registerServiceWorker } from './sw-registration'

render(<App />, document.getElementById('app')!)
registerServiceWorker()
