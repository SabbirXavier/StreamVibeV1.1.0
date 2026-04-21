import React from 'react';

interface SubscriptionCardProps {
  title: string;
  price: string;
  features: string[];
}

export function SubscriptionCard({ title, price, features }: SubscriptionCardProps) {
  return (
    <div className="card">
      <div className="card__border"></div>
      <div className="card_title__container">
        <span className="card_title">{title}</span>
        <p className="card_paragraph">{price} per month</p>
      </div>
      <hr className="line" />
      <ul className="card__list">
        {features.map((feature, idx) => (
          <li key={idx} className="card__list_item">
            <span className="check">
              <svg className="check_svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="list_text">{feature}</span>
          </li>
        ))}
      </ul>
      <button className="button">Subscribe Now</button>
    </div>
  );
}
