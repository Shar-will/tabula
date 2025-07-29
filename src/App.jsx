import { useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">
          Tabula Chrome Extension
        </h1>
        <p className="text-muted-foreground text-lg">
          Welcome to your new tab management system
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => setCount((count) => count + 1)}
            className="w-full max-w-xs"
          >
            Count is {count}
          </Button>
          
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm">
              Primary
            </Button>
            <Button variant="secondary" size="sm">
              Secondary
            </Button>
            <Button variant="destructive" size="sm">
              Destructive
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Tailwind CSS and shadcn/ui are working correctly!
        </p>
      </div>
    </div>
  )
}

export default App
