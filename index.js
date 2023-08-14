import { Client } from "@notionhq/client"
import nodemailer from "nodemailer";
import cron from "node-cron";

// Initializing a client
const notion = new Client({ auth: process.env.NOTION_KEY })

// Getting the database id from .env
const databaseId = process.env.NOTION_DATABASE_ID




// Getting the food events for today
const today = new Date().toISOString().split("T")[0];

async function getFoodEventsForToday(){
    try {
        const response = await notion.databases.query({
          database_id: databaseId,
          filter: {
            property: "Date",
            date: {
              equals: today
            }
          }
        });

        const eventDetails = response.results.map(event => {
            const properties = event.properties;
            return `Event: ${properties.Name.title[0].plain_text}\nLocation: ${properties.Location.rich_text[0].plain_text}\nFood: ${properties.Food.rich_text[0].plain_text}\nStart Time: ${properties['Start Time'].rich_text[0].plain_text}\nEnd Time: ${properties['End Time'].rich_text[0].plain_text}\nDate: ${properties.Date.date.start}\nRSVP: ${properties['RSVP?'].checkbox ? 'Yes' : 'No'}\nLink: ${properties.Link.url}`;
        });
        return eventDetails.join("\n\n");
    } catch (error) {
        console.error(error.body);
    }
}

// Schedule sending the email daily at a specific time
cron.schedule("00 07 * * *", async () => {
    const eventDetails = await getFoodEventsForToday();
    
    // Create a transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASS
        }
    });

    // Send email with defined transport object
    transporter.sendMail({
        from: process.env.EMAIL_ADDRESS,
        to: process.env.EMAIL_ADDRESS,
        subject: "Today's Free Food Events",
        text: eventDetails
    }, (error, info) => {
        if (error) {
            console.log("Error sending email:", error);
        } else {
            console.log("Email sent:", info.response);
        }
    });
}, {
    timezone: "America/Denver" // Set your desired timezone
});
