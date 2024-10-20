// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

console.log("Feedback Email Function Initialized")

Deno.serve(async (req) => {
  try {
    const { record } = await req.json()

    const smtpClient = new SmtpClient()

    // Connect to SMTP server
    await smtpClient.connectTLS({
      hostname: Deno.env.get("SMTP_HOSTNAME") || "localhost",
      port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
      username: Deno.env.get("SMTP_USERNAME") || "your_username",
      password: Deno.env.get("SMTP_PASSWORD") || "your_password",
    })

    // Send email
    await smtpClient.send({
      from: Deno.env.get("SMTP_FROM") || "noreply@yourdomain.com",
      to: Deno.env.get("NOTIFICATION_EMAIL") || "your@email.com",
      subject: "New Feedback Received",
      content: `
        New feedback has been submitted:
        
        ID: ${record.id}
        Message: ${record.message}
        Created At: ${record.created_at}
      `,
    })

    await smtpClient.close()

    console.log("Email sent successfully")

    return new Response(
      JSON.stringify({ message: "Email sent successfully" }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error sending email:", error)
    return new Response(
      JSON.stringify({ error: "Failed to send email" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/sendFeedbackEmail' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"record":{"id":1,"message":"Test feedback","created_at":"2023-04-01T12:00:00Z"}}'

*/