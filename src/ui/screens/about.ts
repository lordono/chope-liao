import { h } from '../dom';
import { go } from '../router';

export function aboutScreen(root: HTMLElement): () => void {
  const sec = (title: string, ...paras: (string | HTMLElement)[]) =>
    h('section', { class: 'about-block' }, h('h2', {}, title), ...paras.map((p) => (typeof p === 'string' ? h('p', {}, p) : p)));

  root.append(
    h(
      'article',
      { class: 'about' },
      h('h1', {}, 'About Chope Liao'),
      sec(
        'Nothing is stored',
        'There is no server, no account, no analytics and no cookies. Your answers live only in this browser tab, and refreshing the page clears them. The only things remembered are your theme and reduced-motion settings.',
      ),
      sec(
        'Your code sits in the link',
        'Your match code packs your results into 16 words. When you share a link, the code goes after the # in the address, so even the website host never receives it.',
        'Codes are encoded, not secret. The scoring code is public, so anyone with your code could decode your results. Only share it with people you are happy to compare with.',
      ),
      sec(
        'How the score works',
        'The quiz measures 21 things about you: personality, daily rhythm (body clock, tidiness, food adventure), life goals, how you communicate, and how you plan. Each question looks at two or three of them at once.',
        'For most things, being similar helps, because day-to-day friction usually comes from different rhythms and goals. Planning is the exception: a planner and a go-with-the-flow person tend to get along best. Your trade-off answers shift what matters most to you, but only halfway, because research shows what people say they want and who they actually click with are not the same thing.',
        'We check the fit both ways and combine the two so a one-sided fit scores low, without ever showing who fits whom better. The result is a band, comparing you with about 100,000 simulated pairs. Those simulated people are made-up answer patterns, not real people.',
        'Big-life topics like kids, smoking, pets, living near family and faith are kept separate. They never change your band; they appear as things worth talking about. In Party Mode, a clear dealbreaker means two people will not be paired.',
      ),
      sec(
        'The fun type is just a label',
        'Your profile card type, like "The Kopi-O Kosong Planner", is a playful summary of your strongest traits. Matching always uses all of your answers.',
      ),
      sec(
        'For fun, not a guarantee of love',
        'Research shows nobody can reliably predict who will click before they meet, not even with fancy algorithms. Treat your band as a conversation starter, not a verdict. The best test is still a good makan session together.',
      ),
      h('div', { class: 'actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => go('/') }, 'Back to start')),
    ),
  );
  return () => {};
}
