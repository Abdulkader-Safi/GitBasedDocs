// Spec: at least 10 characters, no complexity quiz, and refuse the passwords
// people pick first. ponytail: a short list of the most common choices, not
// the full 10k; swap in a bigger file if audits ask for it.
const COMMON = new Set([
  "password", "password1", "password12", "password123", "password1234", "passw0rd",
  "123456789", "1234567890", "12345678910", "0123456789", "987654321", "1111111111",
  "0000000000", "1234512345", "qwertyuiop", "qwerty1234", "qwerty12345", "1q2w3e4r5t",
  "1qaz2wsx3edc", "asdfghjkl", "zxcvbnm123", "iloveyou12", "letmein123", "welcome123",
  "welcome1234", "admin12345", "administrator", "changeme123", "changeme", "football12",
  "baseball12", "sunshine12", "princess12", "superman12", "trustno1234", "dragon1234",
  "monkey12345", "abc1234567", "abcdefghij", "aaaaaaaaaa", "starwars12", "whatever12",
  "michael123", "computer12", "internet12", "qazwsxedc1", "passwordpassword",
  "change-me-on-first-login", "paste-random-32-chars",
])

export function passwordProblem(password: string, email = ""): string | null {
  if (password.length < 10) return "Password must be at least 10 characters."
  if (password.length > 200) return "Password must be at most 200 characters."
  const lower = password.toLowerCase()
  if (COMMON.has(lower)) return "That password is too common. Pick another."
  if (/^(.)\1+$/.test(password)) return "That password is too common. Pick another."
  const local = email.toLowerCase().split("@")[0]
  if (local.length >= 4 && lower.includes(local)) return "Password must not contain your email name."
  return null
}
