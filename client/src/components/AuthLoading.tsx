import Logo from "@/assets/ox-logo.jpg";

export const AuthLoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-10">
      <img
        src={Logo}
        alt="TicketOX"
        className="h-20 w-auto animate-pulse select-none"
        draggable={false}
      />

      <div className="flex gap-2">
        <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/80 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/40" />
      </div>
    </div>
  </div>
);