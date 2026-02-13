import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function SignupPage({ onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email.toLowerCase().endsWith(".edu")) {
      setError("Only .edu email addresses are allowed");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter the same password in both fields.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (displayName.trim()) {
        await updateProfile(user, { displayName: displayName.trim() });
      }

      await user.sendEmailVerification();
      setSuccess("Account created! Please check your email to verify your account before signing in.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setDisplayName("");

      setTimeout(() => onBack(), 3000);
    } catch (err) {
      console.error("Signup error:", err);
      let msg = "Signup failed. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        msg = "This email is already registered. Please sign in instead.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password is too weak. Please choose a stronger password.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Invalid email address. Please check and try again.";
      } else {
        msg = err.message || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
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
          Create Your Account
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-600 dark:text-green-400 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="University email (.edu)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#d4a017]/30 bg-[#f8f4ed] dark:bg-[#3d2c1e]/50 text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/60 dark:placeholder-[#f8f4ed]/70 focus:outline-none focus:ring-2 focus:ring-[#d4a017]"
            required
          />
          <input
            type="password"
            placeholder="Password (at least 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#d4a017]/30 bg-[#f8f4ed] dark:bg-[#3d2c1e]/50 text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/60 dark:placeholder-[#f8f4ed]/70 focus:outline-none focus:ring-2 focus:ring-[#d4a017]"
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#d4a017]/30 bg-[#f8f4ed] dark:bg-[#3d2c1e]/50 text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/60 dark:placeholder-[#f8f4ed]/70 focus:outline-none focus:ring-2 focus:ring-[#d4a017]"
            required
            minLength={6}
          />
          <input
            type="text"
            placeholder="Display name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#d4a017]/30 bg-[#f8f4ed] dark:bg-[#3d2c1e]/50 text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/60 dark:placeholder-[#f8f4ed]/70 focus:outline-none focus:ring-2 focus:ring-[#d4a017]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-60 text-white font-semibold transition-colors"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-6">
          Only verified .edu email addresses can access
        </p>
        <p className="text-center text-sm text-[#3d2c1e]/80 dark:text-[#f8f4ed]/80 mt-2">
          Already have an account?{" "}
          <button type="button" onClick={onBack} className="text-[#d4a017] hover:underline font-medium">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
