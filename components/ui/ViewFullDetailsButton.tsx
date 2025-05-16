import * as React from "react"
import { Info } from "lucide-react"

interface ViewFullDetailsButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
}

export const ViewFullDetailsButton = React.forwardRef<HTMLButtonElement, ViewFullDetailsButtonProps>(
  ({ children = "View Full Details", className = "", ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={
        `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 timeline-about-section__about-tab-button w-full ${className}`
      }
      {...props}
    >
      <Info className="h-4 w-4 mr-2" />
      {children}
    </button>
  )
)

ViewFullDetailsButton.displayName = "ViewFullDetailsButton" 