import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface AuthSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthSheet: React.FC<AuthSheetProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState<string | undefined>("");
  const [whatsapp, setWhatsapp] = useState<string | undefined>("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"organizer" | "guest" | "hotel_partner">("guest");
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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

        setIsSignUp(false); // Switch to sign in after successful signup
      } else {
        await signIn(email, password);
        onClose();
        navigate("/dashboard");
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
          <h2 className="text-white text-4xl font-medium mb-2">
            {isSignUp ? "Create Account" : "Sign In"}
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            {isSignUp
              ? `Join as ${getRoleLabel()}`
              : "Welcome back! Please sign in to continue"}
          </p>

          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            {isSignUp && (
              <>
                {/* Role Selection */}
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

                {/* Display Name */}
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

            {/* Email */}
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

            {/* Phone Input using react-phone-number-input */}
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

            {/* Password */}
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
                  : "Sign In"}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};