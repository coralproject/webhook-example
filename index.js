// We're using express to receive webhooks here.
const app = require("express")();

// We're using @coralproject/events to verify the signatures.
const { Events } = require("@coralproject/events");
const events = new Events(process.env.SIGNING_SECRET);

// Use the body-parser to get the raw body as a buffer so we can use it with the
// hashing functions.
const parser = require("body-parser");

app.post("/webhook", parser.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["x-coral-signature"];

  let event;

  try {
    // Parse the JSON for the event.
    event = events.validate(req.body, sig);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event.
  switch (event.type) {
    case "STORY_CREATED":
      const data = event.data;
      console.log(
        `A Story with ID ${data.storyID} and URL ${data.storyURL} was created!`
      );
      break;
    // ... handle other event types.
    default:
      // Unexpected event type
      return response.status(400).end();
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
});

app.listen(4242, () => console.log("Running on port 4242"));
