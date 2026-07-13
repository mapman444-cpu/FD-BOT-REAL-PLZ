const { SlashCommandBuilder } = require('discord.js');

const jokes = [
    "Why did the scarecrow win an award? Because he was outstanding in his field!",
    "I tried to catch fog yesterday. Mist.",
    "Why don’t eggs tell jokes? They’d crack each other up.",
    "What do you call a fake noodle? An impasta!",
    "I just built an ATM that only gives out coins. I don’t know why no one’s thought of it before: it just makes cents!",
    "Why did the bicycle fall over? Because it was two-tired!",
    "I would tell you a construction joke, but I'm still working on it.",
    "Why did the math book look sad? Because it had too many problems.",
    "I told my wife she was drawing her eyebrows too high. She looked surprised.",
    "Why did the coffee file a police report? It got mugged.",
    "It's not easy being a mom. Otherwise, dads would do it.",
    "I haven't spoken to my wife in years. I thought it would be rude to interrupt her.",
    "I asked my dog what's two minus two. He said nothing.",
    "I used to play piano by ear, but now I use my hands.",
    "How many storm troopers does it take to change a lightbulb? None, because they are all on the dark side."
];

module.exports = {
    data: new SlashCommandBuilder().setName('dadjoke').setDescription('Get a random dad joke'),
    async execute(interaction) {
        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        await interaction.reply(`😂 ${joke}`);
    }
};
