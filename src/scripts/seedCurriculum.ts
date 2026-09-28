import { db } from "../firebase.ts";
import { doc, writeBatch, terminate } from "firebase/firestore";

const curriculum = [
  {
    title: "Carrots Were Originally Purple",
    topic: "Carrots",
    subject: "Nutrition",
    gradeLevel: "K-2",
    content:
      "Carrots originally came in colors such as purple, yellow, red, and white. Orange carrots became popular later.",
    verified: true,
  },

  {
    title: "Carrots Are Root Vegetables",
    topic: "Carrots",
    subject: "Vegetables",
    gradeLevel: "K-2",
    content:
      "Carrots are root vegetables. The part we usually eat grows underground and stores nutrients for the plant.",
    verified: true,
  },

  {
    title: "Broccoli Is a Flower",
    topic: "Broccoli",
    subject: "Vegetables",
    gradeLevel: "K-2",
    content:
      "The part of broccoli we eat is made up of many tiny flower buds that have not opened yet.",
    verified: true,
  },

  {
    title: "Tomatoes Are Fruits",
    topic: "Tomatoes",
    subject: "Nutrition",
    gradeLevel: "K-2",
    content:
      "Tomatoes are fruits because they develop from a flower and contain seeds. In cooking, people often use them like vegetables.",
    verified: true,
  },

  {
    title: "Pumpkins Are Fruits",
    topic: "Pumpkins",
    subject: "Nutrition",
    gradeLevel: "K-2",
    content:
      "Pumpkins are fruits because they grow from flowers and contain seeds. Pumpkins belong to the same plant family as cucumbers and squash.",
    verified: true,
  },

  {
    title: "Cucumbers Have Seeds",
    topic: "Cucumbers",
    subject: "Vegetables",
    gradeLevel: "K-2",
    content:
      "Cucumbers are botanically fruits because they develop from flowers and contain seeds.",
    verified: true,
  },

  {
    title: "Peas Grow Inside Pods",
    topic: "Peas",
    subject: "Vegetables",
    gradeLevel: "K-2",
    content:
      "Peas grow inside pods. The pod protects the pea seeds while they develop.",
    verified: true,
  },

  {
    title: "Beans Are Seeds",
    topic: "Beans",
    subject: "Nutrition",
    gradeLevel: "K-2",
    content:
      "A bean is a seed that can grow into a new bean plant. Beans also provide protein and other nutrients.",
    verified: true,
  },

  {
    title: "Potatoes Grow Underground",
    topic: "Potatoes",
    subject: "Vegetables",
    gradeLevel: "K-2",
    content:
      "Potatoes grow underground. The potato we eat is a special underground plant structure called a tuber.",
    verified: true,
  },

  {
    title: "Potato Eyes Can Grow",
    topic: "Potatoes",
    subject: "Plants",
    gradeLevel: "K-2",
    content:
      "The small eyes on a potato can grow into new potato plants when the conditions are right.",
    verified: true,
  },

  {
    title: "Bell Peppers Change Color",
    topic: "Bell Peppers",
    subject: "Vegetables",
    gradeLevel: "K-2",
    content:
      "Bell peppers can be green, yellow, orange, or red. A pepper can change color as it matures on the plant.",
    verified: true,
  },

  {
    title: "Spinach Contains Iron",
    topic: "Spinach",
    subject: "Nutrition",
    gradeLevel: "K-2",
    content:
      "Spinach contains iron. Iron is a mineral that the body uses to help make healthy blood cells.",
    verified: true,
  },

  {
    title: "Bell Peppers Contain Vitamin C",
    topic: "Bell Peppers",
    subject: "Nutrition",
    gradeLevel: "K-2",
    content:
      "Bell peppers contain vitamin C. Vitamin C helps support the body's normal immune system function.",
    verified: true,
  },

  {
    title: "Sweet Potatoes Are Different From Potatoes",
    topic: "Sweet Potatoes",
    subject: "Vegetables",
    gradeLevel: "K-2",
    content:
      "Sweet potatoes and regular potatoes are different plants. They belong to different plant families.",
    verified: true,
  },

  {
    title: "Corn Is a Grain",
    topic: "Corn",
    subject: "Nutrition",
    gradeLevel: "K-2",
    content:
      "Corn is a grain because it is the seed of a grass plant. Fresh corn is also commonly eaten as a vegetable.",
    verified: true,
  },

  {
    title: "Lettuce Is a Leaf",
    topic: "Lettuce",
    subject: "Vegetables",
    gradeLevel: "K-2",
    content:
      "Lettuce is a leafy vegetable. The leaves grow above the ground and use sunlight to help the plant make food.",
    verified: true,
  },

  {
    title: "Plants Use Sunlight",
    topic: "Plants",
    subject: "Nutrition",
    gradeLevel: "K-2",
    content:
      "Plants use sunlight, water, and carbon dioxide to make their own food through a process called photosynthesis.",
    verified: true,
  },

  {
    title: "Plants Need Water",
    topic: "Plants",
    subject: "Plants",
    gradeLevel: "K-2",
    content:
      "Plants need water to grow and stay healthy. Water helps move nutrients through the plant.",
    verified: true,
  },

  {
    title: "Vegetables Come in Many Colors",
    topic: "Vegetables",
    subject: "Nutrition",
    gradeLevel: "K-2",
    content:
      "Vegetables can be many colors, including green, red, orange, yellow, purple, and white. Eating different kinds of vegetables can add variety to meals.",
    verified: true,
  },

  {
    title: "Leafy Greens Are Vegetables",
    topic: "Leafy Greens",
    subject: "Nutrition",
    gradeLevel: "K-2",
    content:
      "Spinach, lettuce, kale, and collard greens are examples of leafy green vegetables.",
    verified: true,
  },

  {
    title: "Kale Is a Leafy Green",
    topic: "Kale",
    subject: "Vegetables",
    gradeLevel: "K-2",
    content:
      "Kale is a leafy green vegetable. Its leaves can be eaten raw or cooked.",
    verified: true,
  },

  {
    title: "Squash Comes in Many Shapes",
    topic: "Squash",
    subject: "Vegetables",
    gradeLevel: "K-2",
    content:
      "Squash comes in many shapes, sizes, and colors. Zucchini, butternut squash, and acorn squash are all types of squash.",
    verified: true,
  },

  {
    title: "Zucchini Is a Squash",
    topic: "Zucchini",
    subject: "Vegetables",
    gradeLevel: "K-2",
    content:
      "Zucchini is a type of summer squash. It is usually harvested while it is still young and tender.",
    verified: true,
  },

  {
    title: "Vegetables Can Provide Fiber",
    topic: "Fiber",
    subject: "Nutrition",
    gradeLevel: "K-2",
    content:
      "Many vegetables contain dietary fiber. Fiber helps food move through the digestive system.",
    verified: true,
  },

  {
    title: "Eating a Variety of Foods",
    topic: "Balanced Eating",
    subject: "Nutrition",
    gradeLevel: "K-2",
    content:
      "Different foods provide different nutrients. Eating a variety of foods helps people get many of the nutrients their bodies need.",
    verified: true,
  },
];

function toId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seedCurriculum() {
  console.log(`Adding ${curriculum.length} curriculum documents...`);

  try {
    const batch = writeBatch(db);

    for (const item of curriculum) {
      batch.set(doc(db, "curriculum", toId(item.title)), item);
    }

    await batch.commit();
    console.log(`✓ Added ${curriculum.length} documents to "curriculum"`);
  } catch (error) {
    console.error("✗ Seeding failed", error);
    process.exitCode = 1;
  } finally {
    await terminate(db); // close the connection so the script can exit
  }
}

seedCurriculum();