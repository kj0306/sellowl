import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { verifyAuth } from "../lib/api";

export default function LoginPage({ onLogin, onShowSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email.toLowerCase().endsWith(".edu")) {
      setError("Only .edu email addresses are allowed");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await auth.signOut();
        setError("Please verify your email address. Check your inbox for the verification link.");
        setLoading(false);
        return;
      }

      const idToken = await user.getIdToken();
      await verifyAuth(idToken);
      onLogin();
    } catch (err) {
      console.error("Login error:", err);
      let msg = err.message || "Login failed. Please try again.";
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        msg = "Wrong email or password. Use the exact email you signed up with. Try Forgot password? to reset.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const { sendPasswordResetEmail } = await import("firebase/auth");
    if (!resetEmail.trim() || !resetEmail.endsWith(".edu")) {
      setResetMessage("Please enter your .edu email.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("Check your inbox for the password reset link.");
    } catch (err) {
      setResetMessage(
        err.code === "auth/user-not-found"
          ? "No account found with this email. Sign up first."
          : err.message || "Failed to send reset email."
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f4ed] dark:bg-[#1a1612] p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <img src="/Logos/FULL.png" alt="Sell OWL" className="w-40 h-40 object-contain" />
        </div>
        <h1 className="text-3xl font-bold text-center text-[#d4a017] font-['Playfair_Display']">
          Sell OWL
        </h1>
        <p className="text-center text-[#3d2c1e]/80 dark:text-[#f8f4ed]/80 text-sm mt-1">
          Student Marketplace & Sublease
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="University email (.edu)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#d4a017]/30 bg-[#f8f4ed] dark:bg-[#3d2c1e]/50 text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/50 focus:outline-none focus:ring-2 focus:ring-[#d4a017]"
            required
          />
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#d4a017]/30 bg-[#f8f4ed] dark:bg-[#3d2c1e]/50 text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/50 focus:outline-none focus:ring-2 focus:ring-[#d4a017]"
              required
            />
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="mt-1 text-sm text-[#d4a017] hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-60 text-white font-semibold transition-colors"
          >
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>

        {showForgot && (
          <div className="mt-4 p-4 rounded-lg bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/5 space-y-2">
            <p className="text-sm text-[#3d2c1e]/80 dark:text-[#f8f4ed]/80">
              Enter your .edu email to get a password reset link:
            </p>
            <input
              type="email"
              placeholder="yourname@university.edu"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#d4a017]/20 bg-[#f8f4ed] dark:bg-[#3d2c1e]/50 text-[#1a1612] dark:text-[#f8f4ed] text-sm"
            />
            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full py-2 rounded-lg bg-[#d4a017] hover:bg-[#b8860b] text-white text-sm font-medium"
            >
              Send reset link
            </button>
            {resetMessage && (
              <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">{resetMessage}</p>
            )}
          </div>
        )}

        <p className="text-center text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-6">
          Join the trusted student-only marketplace
        </p>
        <p className="text-center text-sm text-[#3d2c1e]/80 dark:text-[#f8f4ed]/80 mt-2">
          Don&apos;t have an account?{" "}
          <button type="button" onClick={onShowSignup} className="text-[#d4a017] hover:underline font-medium">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
