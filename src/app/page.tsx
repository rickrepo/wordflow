import WordFlow from "@/components/WordFlow";

// Sample story for children - simple, engaging words
const sampleStory = `
Once upon a time, there was a little cat named Whiskers.
Whiskers loved to play in the sunny garden.
One day, she found a big red ball.
The ball bounced high into the sky!
Whiskers jumped and jumped, but the ball was too high.
A friendly bird came down and helped.
Together, they played all day long.
When the sun went down, Whiskers went home happy.
The end.
`.trim();

export default function Home() {
  return (
    <main className="h-full w-full">
      <WordFlow text={sampleStory} title="The Cat and the Ball" />
    </main>
  );
}
