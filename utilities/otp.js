  import crypto from "crypto";

  const generateOtp = () => {
   return Math.floor(1000 + Math.random() * 9000).toString();  // 6-digit OTP
  };

  const hashOtp = (otp) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
  };

  export { generateOtp, hashOtp };
