import { useState } from 'react';
import { footerColumns } from '../data/content.js';
import Logo from './Logo.jsx';

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div>
              <a className="brand" href="#top">
                <Logo />
                <span className="brand__name">
                  Dongar<em>Diaries</em>
                </span>
              </a>
              <p className="quote footer__tagline">
                Raw geographic solitude and slow, deliberate cinematic travel curated for
                high-altitude explorers and intentional souls.
              </p>
            </div>
            <div className="footer__hq">
              <span className="label tone-green">Field Headquarters &amp; Coordinates</span>
              <span>32.2396° N, 77.1887° E — Manali / Leh / Spiti</span>
            </div>
          </div>

          <div className="footer__right">
            <div className="card newsletter">
              <h4 className="title-sm">Expedition Notes &amp; Remote Dispatches</h4>
              <p className="body-text">
                Receive intimate seasonal dossiers, unmapped route accounts, and rare expedition
                openings directly to your inbox.
              </p>
              {subscribed ? (
                <p className="form-success" role="status">
                  You&apos;re on the list. Watch your inbox for the next dispatch.
                </p>
              ) : (
                <form
                  className="inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubscribed(true);
                  }}
                >
                  <label className="sr-only" htmlFor="newsletter-email">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    className="input"
                    type="email"
                    required
                    placeholder="Enter your email address"
                  />
                  <button type="submit" className="btn btn--primary">
                    Transmit
                  </button>
                </form>
              )}
            </div>

            <div className="footer__links">
              {footerColumns.map((col) => (
                <div key={col.title}>
                  <span className="label footer__coltitle">{col.title}</span>
                  <ul>
                    {col.links.map((l) => (
                      <li key={l}>
                        <a href="#top">{l}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Dongar Diaries. All rights reserved.</span>
          <div>
            <span>Crafted with Cinematic Precision</span>
            <a href="#top">Privacy Policy</a>
            <a href="#top">Terms of Transit</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
