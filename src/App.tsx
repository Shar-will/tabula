import AnimatedButton from './components/ui/AnimatedButton'
import DragDropTest from './components/ui/DragDropTest'

function App() {

  return (
    <div className="min-h-screen bg-red-500 flex flex-col items-center justify-center p-8">
       <h1 className="text-2xl font-bold mb-4 text-white">Tabula Extension</h1>
       <AnimatedButton /> 
       <DragDropTest />
    </div>
  )
}

export default App
