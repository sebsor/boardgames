// bgg.js — BoardGameGeek API wrapper
// BGG returns XML, so we parse it into clean JS objects.
// Using a CORS proxy since BGG doesn't allow direct browser requests.

const BGG_PROXY = 'https://api.allorigins.win/raw?url=';
const BGG_BASE  = 'https://boardgamegeek.com/xmlapi2';

const bgg = {
  // Search BGG for games by name
  async search(query) {
    const url = `${BGG_BASE}/search?query=${encodeURIComponent(query)}&type=boardgame&exact=0`;
    try {
      const res = await fetch(`${BGG_PROXY}${encodeURIComponent(url)}`);
      const text = await res.text();
      const xml = new DOMParser().parseFromString(text, 'text/xml');
      const items = [...xml.querySelectorAll('item')].slice(0, 8);
      return items.map(item => ({
        bggId: item.getAttribute('id'),
        title: item.querySelector('name[type="primary"]')?.getAttribute('value') || 'Unknown',
        year: item.querySelector('yearpublished')?.getAttribute('value') || '',
      }));
    } catch (err) {
      console.error('BGG search failed', err);
      return [];
    }
  },

  // Fetch full game details by BGG ID
  async getGame(bggId) {
    const url = `${BGG_BASE}/thing?id=${bggId}&stats=1`;
    try {
      const res = await fetch(`${BGG_PROXY}${encodeURIComponent(url)}`);
      const text = await res.text();
      const xml = new DOMParser().parseFromString(text, 'text/xml');
      const item = xml.querySelector('item');
      if (!item) return null;

      const thumb = item.querySelector('thumbnail')?.textContent?.trim() || '';
      const image = item.querySelector('image')?.textContent?.trim() || '';
      const minP = parseInt(item.querySelector('minplayers')?.getAttribute('value')) || 1;
      const maxP = parseInt(item.querySelector('maxplayers')?.getAttribute('value')) || 4;
      const complexity = parseFloat(
        item.querySelector('averageweight')?.getAttribute('value')
      ) || 2.5;
      const title = item.querySelector('name[type="primary"]')?.getAttribute('value') || 'Unknown';
      const year = item.querySelector('yearpublished')?.getAttribute('value') || '';

      return { bggId, title, year, thumbUrl: thumb, coverUrl: image, minPlayers: minP, maxPlayers: maxP, complexity: Math.round(complexity * 10) / 10 };
    } catch (err) {
      console.error('BGG fetch failed', err);
      return null;
    }
  },
};
