// We're using crypto to verify the signatures.
const crypto = require("crypto");

// We're using express to receive webhooks here.
const app = require("express")();

// Use the body-parser to get the raw body as a buffer so we can use it with the
// hashing functions.
const parser = require("body-parser");

function extractEvent(body, sig) {
  // Step 1: Extract signatures from the header.
  const signatures = sig
    // Split the header by `,` to get a list of elements.
    .split(",")
    // Split each element by `=` to get a prefix and value pair.
    .map(element => element.split("="))
    // Grab all the elements with the prefix of `sha256`.
    .filter(([prefix]) => prefix === "sha256")
    // Grab the value from the prefix and value pair.
    .map(([, value]) => value);

  // Step 2: Prepare the `signed_payload`.
  const signed_payload = body;

  // Step 3: Calculate the expected signature.
  const expected = crypto
    .createHmac("sha256", process.env.SIGNING_SECRET)
    .update(signed_payload)
    .digest()
    .toString("hex");

  // Step 4: Compare signatures.
  if (
    // For each of the signatures on the request...
    !signatures.some(signature =>
      // Compare the expected signature to the signature on in the header. If at
      // least one of the match, we should continue to process the event.
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
  ) {
    throw new Error("Invalid signature");
  }

  // Parse the JSON for the event.
  return JSON.parse(body.toString());
}

app.post("/webhook", parser.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["x-coral-signature"];

  let event;

  try {
    // Parse the JSON for the event.
    event = extractEvent(req.body, sig);
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
