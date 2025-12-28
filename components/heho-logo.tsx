export function HeHoLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        {/* Water wave icon */}
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center relative overflow-hidden">
          <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 to-transparent opacity-60" />
        </div>
      </div>
      <span className="text-xl font-bold text-foreground">HeHo</span>
    </div>
  )
}
