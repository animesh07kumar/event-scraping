import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
})

export const sendMail = async (
  to: string,
  subject: string,
  text: string
) => {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
    })

    return { success: true }
  } catch (error) {
    console.error("Mailing Error:", error)
    return { success: false }
  }
}