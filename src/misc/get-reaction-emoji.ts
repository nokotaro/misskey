export default function getReactionEmoji(reaction: string): string {
	switch (reaction) {
		case 'like': return '👍';
		case 'love': return '❤️';
		case 'laugh': return '😆';
		case 'hmm': return '🤔';
		case 'surprise': return '😮';
		case 'congrats': return '🎉';
		case 'angry': return '💢';
		case 'confused': return '😥';
		case 'rip': return '😇';
		case 'pudding': return '🍮';
		case 'star': return '⭐';
		case 'twitter_favorite': return '❤️';
		default: return reaction;
	}
}
