// import { NextResponse } from 'next/server';
// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);


// export async function POST(request: Request) {
// 	try {
// 		const formData = await request.formData();
// 		const digit = formData.get('Digits'); // Get the digit pressed
// 		const doctorPhone = formData.get('From'); // Doctor's phone number

// 		// Get the patient's email from the request URL
// 		const url = new URL(request.url);
// 		const patientEmail = url.searchParams.get("patientEmail");

// 		if (!patientEmail) {
// 			console.error("Patient email missing.");
// 			return NextResponse.json({ success: false, error: "Missing patient email" }, { status: 400 });
// 		}

// 		if (digit === '1') {
// 			console.log(`Doctor ${doctorPhone} confirmed the appointment.`);
			
// 			// Send confirmation email to the patient
// 			await resend.emails.send({
// 				from: 'onboarding@resend.dev', // Use your verified sender
// 				to: patientEmail,
// 				subject: 'Your Appointment is Confirmed for Today',
// 				html: `
// 					<p>Dear Patient,</p>
// 					<p>We are pleased to inform you that your appointment with the doctor has been <strong>confirmed</strong> for <strong>today</strong>.</p>
// 					<p><strong>Details:</strong></p>
// 					<ul>
// 						<li><strong>Date:</strong> Today</li>
// 						<li><strong>Doctor:</strong> Your assigned doctor</li>
// 						<li><strong>Location:</strong> [Clinic/Hospital Name]</li>
// 					</ul>
// 					<p>Please arrive on time and bring any necessary documents.</p>
// 					<p>If you have any questions or need to reschedule, please contact us at <a href="mailto:support@yourclinic.com">support@yourclinic.com</a>.</p>
// 					<p>Best regards,</p>
// 					<p><strong>Your Clinic Name</strong></p>
// 				`
// 			});

// 			// Thank the doctor
// 			const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
// 				<Response>
// 					<Say voice="alice">Thank you, doctor, for confirming the appointment we have sent an email to the patient. Have a great day!</Say>
// 				</Response>`;
// 			return new Response(twimlResponse, {
// 				headers: { 'Content-Type': 'text/xml' }
// 			});
// 		}

// 		if (digit === '2') {
// 			console.log(`Doctor ${doctorPhone} declined the appointment.`);
// 			const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
// 				<Response>
// 					<Say voice="alice">Thank you, doctor. We will reach out again later to reschedule.</Say>
// 				</Response>`;
// 			return new Response(twimlResponse, {
// 				headers: { 'Content-Type': 'text/xml' }
// 			});
// 		}

// 		// If an invalid key is pressed
// 		const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
// 			<Response>
// 				<Say voice="alice">Invalid response. Please try again.</Say>
// 			</Response>`;
// 		return new Response(twimlResponse, {
// 			headers: { 'Content-Type': 'text/xml' }
// 		});

// 	} catch (error) {
// 		console.error("Error processing Twilio response:", error);
// 		return NextResponse.json(
// 			{ success: false, error: "Failed to process response." },
// 			{ status: 500 }
// 		);
// 	}
// }
