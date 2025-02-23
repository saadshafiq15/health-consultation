import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// Generate TwiML response for the doctor
function generateTwiML(doctorName: string, patientName: string, diagnosis: string, suggestedDate: string, patientEmail: string) {
	return `<?xml version="1.0" encoding="UTF-8"?>
		<Response>
			<Say voice="alice" language="en-US">
				Hello ${doctorName}, this is an automated call from the AI Health Assistant.
				Your patient, ${patientName}, has completed an AI-assisted diagnosis with the following result:
				${diagnosis}.
			</Say>
			<Say voice="alice">
				We would like to schedule an appointment for ${patientName} on ${suggestedDate}.
				If this time works for you, press 1 to confirm. If you would like to suggest a different time, press 2.
			</Say>
			<Gather numDigits="1" action="${process.env.WEBHOOK_URL}/api/process-response?patientEmail=${encodeURIComponent(patientEmail)}" method="POST">
				<Say>Press 1 to confirm the appointment. Press 2 to suggest another time.</Say>
			</Gather>
		</Response>`;
}

export async function POST(request: Request) {
	try {
		const { doctorName, doctorPhone, patientName, diagnosis, suggestedDate, patientEmail } = await request.json();
		const client = twilio(accountSid, authToken);

		// Generate TwiML with details
		const twiml = generateTwiML(doctorName, patientName, diagnosis, suggestedDate, patientEmail);
		const response = await client.calls.create({
			to: doctorPhone,
			//@ts-expect-error
			from: twilioPhone,
			twiml
		});

		return NextResponse.json({ 
			success: true, 
			callSid: response.sid 
		});

	} catch (error) {
		console.error('Error making phone call:', error);
		return NextResponse.json(
			{ success: false, error: 'Failed to make phone call' },
			{ status: 500 }
		);
	}
}
