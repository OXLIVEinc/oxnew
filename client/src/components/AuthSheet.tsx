import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface AuthSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = "signin" | "signup" | "forgot";

export const AuthSheet: React.FC<AuthSheetProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState<string | undefined>("");
  const [whatsapp, setWhatsapp] = useState<string | undefined>("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"organizer" | "guest" | "hotel_partner">("guest");
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isSignUp = mode === "signup";
  const isForgot = mode === "forgot";

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp({
          email,
          password,
          displayName,
          role,
          phone: role !== "hotel_partner" ? phone : undefined,
          whatsapp: role === "hotel_partner" ? whatsapp : undefined,
        });
        setMode("signin"); // Switch back to sign in
      } else if (isForgot) {
        await resetPassword(email);
        // toast({
        //   title: "Check your email",
        //   description: "Password reset instructions sent.",
        // });
        // // Optionally close or switch back to signin
        // setMode("signin");
        // setEmail("");
      } else {
        await signIn(email, password);
        // onClose();
        // navigate("/dashboard");
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case "organizer":
        return "Event Organizer";
      case "guest":
        return "Guest";
      case "hotel_partner":
        return "Hotel Partner";
      default:
        return "User";
    }
  };

  const handleBackToSignIn = () => {
    setMode("signin");
    setEmail("");
    setPassword("");
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[1000]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-[#1A1A1A] z-[3000] shadow-2xl transition-transform duration-300 overflow-y-auto overscroll-contain ${isOpen ? "animate-slide-in-right" : ""}`}
        style={{ WebkitOverflowScrolling: "touch" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-10 p-2 touch-manipulation"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col h-full px-6 sm:px-10 pt-16 sm:pt-24 pb-10">
          <div className="flex items-center gap-3 mb-2">
            {isForgot && (
              <button
                onClick={handleBackToSignIn}
                className="text-white hover:text-gray-300"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <h2 className="text-white text-4xl font-medium">
              {isForgot
                ? "Reset Password"
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
            </h2>
          </div>

          <p className="text-gray-400 text-sm mb-8">
            {isForgot
              ? "Enter your email and we'll send you a reset link"
              : isSignUp
                ? `Join as ${getRoleLabel()}`
                : "Welcome back! Please sign in to continue"}
          </p>

          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            {/* Forgot Password Form */}
            {isForgot ? (
              <>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-white text-sm font-medium mb-2 uppercase tracking-wide"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 text-base focus:outline-none focus:border-[#FA76FF] transition-colors touch-manipulation"
                    placeholder="your@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-[#FA76FF] text-black font-medium py-3 px-6 uppercase text-sm border border-black hover:bg-[#ff8fff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending reset link..." : "Send Reset Link"}
                </button>

                <button
                  type="button"
                  onClick={handleBackToSignIn}
                  className="text-sm text-gray-400 hover:text-white transition-colors text-center"
                >
                  Back to Sign In
                </button>
              </>
            ) : (
              <>
                {/* Existing Sign Up / Sign In fields */}
                {isSignUp && (
                  <>
                    {/* Role Selection, Display Name, etc. — unchanged */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-3 uppercase tracking-wide">
                        I am a
                      </label>
                      <div className="grid grid-cols-3 gap-0">
                        <button
                          type="button"
                          onClick={() => setRole("organizer")}
                          className={`px-4 py-3 text-sm font-medium uppercase border transition-colors ${
                            role === "organizer"
                              ? "bg-[#FA76FF] text-black border-[#FA76FF]"
                              : "bg-transparent text-white border-white/20 hover:border-white/40"
                          }`}
                        >
                          Organizer
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole("guest")}
                          className={`px-4 py-3 text-sm font-medium uppercase border border-l-0 transition-colors ${
                            role === "guest"
                              ? "bg-[#FA76FF] text-black border-[#FA76FF]"
                              : "bg-transparent text-white border-white/20 hover:border-white/40"
                          }`}
                        >
                          Guest
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole("hotel_partner")}
                          className={`px-4 py-3 text-sm font-medium uppercase border border-l-0 transition-colors ${
                            role === "hotel_partner"
                              ? "bg-[#FA76FF] text-black border-[#FA76FF]"
                              : "bg-transparent text-white border-white/20 hover:border-white/40"
                          }`}
                        >
                          Partner
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="displayName"
                        className="block text-white text-sm font-medium mb-2 uppercase tracking-wide"
                      >
                        {role === "hotel_partner" ? "Owner's Full Name" : "Full Name"}
                      </label>
                      <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 text-base focus:outline-none focus:border-[#FA76FF] transition-colors touch-manipulation"
                        placeholder={role === "hotel_partner" ? "John Doe (Owner)" : "John Doe"}
                      />
                    </div>
                  </>
                )}

                {/* Email Field (used by both signin & signup) */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-white text-sm font-medium mb-2 uppercase tracking-wide"
                  >
                    {role === "hotel_partner" ? "Owner's Email" : "Email"}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 text-base focus:outline-none focus:border-[#FA76FF] transition-colors touch-manipulation"
                    placeholder="your@email.com"
                  />
                </div>

                {/* Phone / WhatsApp (Signup only) */}
                {isSignUp && (
                  <>
                    {role === "hotel_partner" ? (
                      <div>
                        <label
                          htmlFor="whatsapp"
                          className="block text-white text-sm font-medium mb-2 uppercase tracking-wide"
                        >
                          Owner's WhatsApp Number
                        </label>
                        <div className="phone-input-wrapper bg-white/10 border border-white/20 rounded-none focus-within:border-[#FA76FF] transition-colors">
                          <PhoneInput
                            id="whatsapp"
                            international
                            defaultCountry="NG"
                            value={whatsapp}
                            onChange={setWhatsapp}
                            placeholder="Enter WhatsApp number"
                            className="w-full bg-transparent text-white px-4 py-3 text-base focus:outline-none"
                            countrySelectProps={{
                              className: "bg-transparent text-white border-r border-white/20 px-2 py-3"
                            }}
                          />
                        </div>
                        <p className="text-gray-400 text-xs mt-1">Nigeria (+234) selected by default</p>
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-white text-sm font-medium mb-2 uppercase tracking-wide"
                        >
                          Phone Number
                        </label>
                        <div className="phone-input-wrapper bg-white/10 border border-white/20 rounded-none focus-within:border-[#FA76FF] transition-colors">
                          <PhoneInput
                            id="phone"
                            international
                            defaultCountry="NG"
                            value={phone}
                            onChange={setPhone}
                            placeholder="Enter phone number"
                            className="w-full bg-transparent text-white px-4 py-3 text-base focus:outline-none"
                            countrySelectProps={{
                              className: "bg-transparent text-white border-r border-white/20 px-2 py-3"
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Password (only for signin/signup, not forgot) */}
                {!isForgot && (
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-white text-sm font-medium mb-2 uppercase tracking-wide"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 text-base focus:outline-none focus:border-[#FA76FF] transition-colors touch-manipulation"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FA76FF] text-black font-medium py-3 px-6 uppercase text-sm border border-black hover:bg-[#ff8fff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Please wait..."
                    : isSignUp
                      ? `Create ${getRoleLabel()} Account`
                      : isForgot
                        ? "Send Reset Link"
                        : "Sign In"}
                </button>

                {/* Forgot Password Link - only on sign in */}
                {!isSignUp && !isForgot && (
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-sm text-[#FA76FF] hover:text-[#ff8fff] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </>
            )}
          </form>

          {/* Toggle between Sign Up / Sign In - hide when in forgot mode */}
          {!isForgot && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setMode(isSignUp ? "signin" : "signup")}
                className="text-gray-400 mb-4 hover:text-white transition-colors text-sm"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Create one"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};