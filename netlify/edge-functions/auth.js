export default async (request, context) => {
  const validUser = Netlify.env.get('AUTH_USER');
  const validPass = Netlify.env.get('AUTH_PASS');

  // Skip auth if env vars not configured (e.g. local dev)
  if (!validUser || !validPass) {
    return context.next();
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const decoded = atob(authHeader.slice(6));
      const colon = decoded.indexOf(':');
      if (colon !== -1) {
        const user = decoded.slice(0, colon);
        const pass = decoded.slice(colon + 1);
        if (user === validUser && pass === validPass) {
          return context.next();
        }
      }
    } catch (e) {}
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="What\'s Going On", charset="UTF-8"'
    }
  });
};

export const config = { path: '/*' };
