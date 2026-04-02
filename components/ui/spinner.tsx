import { cn } from '@/lib/utils'

function Spinner({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('inline-flex size-4 rounded-full bg-current/60 motion-safe:animate-pulse', className)}
      {...props}
    />
  )
}

export { Spinner }
