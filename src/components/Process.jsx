import { steps } from '../data/content.js';
import { Item, Stagger } from './motion.jsx';
import SectionHeading from './SectionHeading.jsx';

export default function Process() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head section-head--narrow">
          <SectionHeading eyebrow="Simple Process" title="How The Journey" accent="unfolds." />
          <p className="body-text">
            No impersonal booking engines. We curate every single convoy group through real
            conversations.
          </p>
        </div>

        <Stagger as="ol" className="three-grid steps">
          {steps.map((s) => (
            <Item as="li" key={s.num} className="card info-card">
              <div>
                <span className={`step-num tone-${s.tone}`}>{s.num}</span>
                <h3 className="title-sm">{s.title}</h3>
                <p className="body-text">{s.text}</p>
              </div>
              <div className="info-card__foot">
                <span className="label tone-muted">{s.footer}</span>
              </div>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
