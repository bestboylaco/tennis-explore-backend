// server/src/services/visualService.js

const visualLibrary = [
  {
    id: "serve_toss_01",
    src: "/images/tennis/serve/serve-toss.jpg",
    title: "Serve Ball Toss",
    skill: "serve",
    tags: ["serve", "ball_toss", "beginner", "technique"],
    type: "technique",
    level: "beginner",
    caption: "Keep the toss slightly in front of the body."
  },
  {
    id: "serve_contact_01",
    src: "/images/tennis/serve/serve-contact.jpg",
    title: "Serve Contact Point",
    skill: "serve",
    tags: ["serve", "contact_point", "extension", "technique"],
    type: "technique",
    level: "beginner",
    caption: "Reach up and contact the ball at full extension."
  },
  {
    id: "serve_error_01",
    src: "/images/tennis/serve/low-contact-error.jpg",
    title: "Low Contact Error",
    skill: "serve",
    tags: ["serve", "low_contact", "error"],
    type: "error",
    level: "beginner",
    caption: "Common mistake: contacting the ball too low."
  },

  {
    id: "forehand_ready_01",
    src: "/images/tennis/forehand/forehand-ready.jpg",
    title: "Forehand Ready Position",
    skill: "forehand",
    tags: ["forehand", "ready_position", "preparation", "technique"],
    type: "technique",
    level: "beginner",
    caption: "Prepare early with your body turned sideways."
  },
  {
    id: "forehand_contact_01",
    src: "/images/tennis/forehand/forehand-contact.jpg",
    title: "Forehand Contact Point",
    skill: "forehand",
    tags: ["forehand", "contact_point", "technique"],
    type: "technique",
    level: "beginner",
    caption: "Meet the ball in front of your body."
  },

  {
    id: "backhand_grip_01",
    src: "/images/tennis/backhand/backhand-grip.jpg",
    title: "Two-Handed Backhand Grip",
    skill: "backhand",
    tags: ["backhand", "grip", "two_handed", "technique"],
    type: "technique",
    level: "beginner",
    caption: "Use two hands for better control as a beginner."
  },
  {
    id: "backhand_stance_01",
    src: "/images/tennis/backhand/backhand-stance.jpg",
    title: "Backhand Preparation",
    skill: "backhand",
    tags: ["backhand", "preparation", "shoulder_turn", "technique"],
    type: "technique",
    level: "beginner",
    caption: "Turn your shoulders before the ball arrives."
  },

  {
    id: "footwork_split_step_01",
    src: "/images/tennis/footwork/split-step.jpg",
    title: "Split Step",
    skill: "footwork",
    tags: ["footwork", "split_step", "movement", "technique"],
    type: "movement",
    level: "beginner",
    caption: "Use a split step before your opponent hits."
  }
];

export function generateVisualTags(question, answer = "") {
  const text = `${question} ${answer}`.toLowerCase();

  const tags = [];
  let skill = "general";
  let level = "beginner";

  if (text.includes("serve") || text.includes("toss")) {
    skill = "serve";
    tags.push("serve");

    if (text.includes("toss")) tags.push("ball_toss");
    if (text.includes("contact")) tags.push("contact_point");
    if (text.includes("follow")) tags.push("follow_through");
    if (text.includes("power")) tags.push("power");
  }

  if (text.includes("forehand")) {
    skill = "forehand";
    tags.push("forehand");

    if (text.includes("contact")) tags.push("contact_point");
    if (text.includes("prepare") || text.includes("early")) tags.push("preparation");
  }

  if (text.includes("backhand")) {
    skill = "backhand";
    tags.push("backhand");

    if (text.includes("grip")) tags.push("grip");
    if (text.includes("two hand") || text.includes("two-handed")) tags.push("two_handed");
  }

  if (
    text.includes("footwork") ||
    text.includes("movement") ||
    text.includes("split step")
  ) {
    skill = "footwork";
    tags.push("footwork", "movement");

    if (text.includes("split step")) tags.push("split_step");
  }

  if (
    text.includes("mistake") ||
    text.includes("error") ||
    text.includes("wrong") ||
    text.includes("problem")
  ) {
    tags.push("error");
  }

  if (
    text.includes("drill") ||
    text.includes("practice") ||
    text.includes("training")
  ) {
    tags.push("drill");
  }

  return {
    skill,
    level,
    visual_tags: [...new Set(tags)]
  };
}

export function retrieveVisuals({ skill, level, visual_tags }, limit = 3) {
  return visualLibrary
    .map((image) => {
      let score = 0;

      if (image.skill === skill) score += 5;
      if (image.level === level) score += 2;

      image.tags.forEach((tag) => {
        if (visual_tags.includes(tag)) score += 3;
      });

      return {
        ...image,
        score
      };
    })
    .filter((image) => image.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}