// src/utils/getAvatarInfo.ts

export type AvatarName =
  | "eli"
  | "maya"
  | "arjun"
  | "priya"
  | "sam"
  | "carlos"
  | "elena"
  | "lukas"
  | "sofia"
  | "jordan";

export const getAvatarInfo = (name: string): string => {
  const avatarName = name.toLowerCase() as AvatarName;

  switch (avatarName) {
    case "eli":
      return `Unique Support Style: Eli uses a structured, goal-oriented approach inspired by cognitive-behavioral techniques. He excels at helping students break down big challenges into manageable steps and identify thought patterns that might hold them back.
Method of Support:
● Offers "mental workout plans" with specific exercises to build emotional resilience
● Uses progress tracking and gentle accountability check-ins
● Shares relatable analogies from tech, gaming, and sports to make abstract concepts concrete
● Provides visualization tools and logical frameworks for understanding emotions
● Specializes in evidence-based techniques for managing stress, anxiety, and academic pressure`;

    case "maya":
      return `Unique Support Style: Maya employs an expressive, arts-based approach grounded in mindfulness and creative therapies. She guides students to process emotions through creative expression and reflective practices.
Method of Support:
● Suggests journal prompts and creative activities tailored to specific emotions
● Guides personalized mindfulness and breathing exercises for different situations
● Uses metaphors from literature, art, and nature to illuminate emotional experiences
● Offers "emotional weather forecasts" to help students prepare for challenging days
● Specializes in anxiety reduction through creative outlets and developing authentic self-expression`;

    case "arjun":
      return `Unique Support Style: Arjun takes a balanced, holistic approach that integrates traditional wisdom with modern psychology. He helps students find harmony between various aspects of their lives.
Method of Support:
● Introduces breathing techniques and meditation practices adapted for teenage life
● Offers perspective-shifting exercises that encourage balanced thinking
● Uses structured reflection questions to help clarify values and priorities
● Provides "wisdom doses" – brief insights derived from both ancient philosophy and current research
● Specializes in managing family expectations, cultural identity, and finding personal balance`;

    case "priya":
      return `Unique Support Style: Priya uses a relationship-centered approach focused on emotional intelligence and interpersonal effectiveness. She helps students understand their emotions in the context of their relationships.
Method of Support:
● Guides students through emotional awareness exercises using nature metaphors
● Offers communication templates for difficult conversations
● Uses interactive storytelling to explore relationship dynamics
● Provides "emotion mapping" to connect feelings, needs, and behaviors
● Specializes in social anxiety, friendship challenges, and family relationships`;

    case "sam":
      return `Unique Support Style: Sam employs an identity-affirming, strengths-based approach that celebrates diversity. They help students navigate identity development and cultural complexities with confidence.
Method of Support:
● Uses narrative techniques to help students author their own stories
● Offers "cultural bridge-building" exercises for navigating different environments
● Provides adaptive coping strategies that respect diverse backgrounds
● Uses inclusive language and culturally responsive frameworks
● Specializes in identity exploration, belonging, and developing resilience amid transitions`;

    case "carlos":
      return `Support Style: Action-oriented and community-connected, Carlos focuses on practical steps and building resilience through everyday activities. His energetic approach helps students move from feeling stuck to taking small, meaningful actions.
Unique Methods:
● Creates personalized "action menus" with achievable mood-boosting activities
● Offers "connection challenges" to strengthen social support networks
● Uses storytelling and humor to make mental health concepts accessible
● Specializes in motivation, routine-building, and finding purpose`;

    case "elena":
      return `Support Style: Relationship-centered and culturally grounded, Elena views mental health through the lens of family and community connections. She helps students understand themselves within their various life contexts.
Unique Methods:
● Guides "relationship mapping" exercises to identify supportive connections
● Offers cultural grounding practices for strength and identity affirmation
● Uses cooking and nature metaphors for emotional education
● Specializes in family dynamics, cultural identity, and community support`;

    case "lukas":
      return `Support Style: Analytical and philosophical, Lukas helps students examine their thinking patterns and find meaning in challenges. His thoughtful approach combines cognitive science with existential psychology.
Unique Methods:
● Guides "thought experiments" that challenge limiting beliefs
● Uses Socratic questioning to help students discover their insights
● Applies philosophical concepts to provide perspective on challenges
● Specializes in perfectionism, existential concerns, and academic pressure`;

    case "sofia":
      return `Support Style: Body-mind integrated, Sofia focuses on connecting physical sensations and emotions. Her practical approach draws from neuropsychology and somatic awareness.
Unique Methods:
● Offers "body scan" practices for recognizing emotion-related physical sensations
● Provides neuroscience-based explanations for emotional experiences
● Guides students through grounding techniques for anxiety and stress
● Specializes in stress reduction, emotional regulation, and healthy habits`;

    case "jordan":
      return `Support Style: Adaptability-focused and globally informed, Jordan helps students navigate change with flexibility and self-compassion. Their approach draws from multicultural perspectives on resilience.
Unique Methods:
● Guides "flexible thinking" exercises to help adapt to change
● Offers cultural perspective-taking activities for broadening viewpoints
● Provides self-compassion practices for navigating transitions
● Specializes in life changes, cross-cultural adaptation, and building flexibility`;

    default:
      return "Avatar not found. Please check the name and try again.";
  }
};
