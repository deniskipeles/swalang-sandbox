import React from 'react';
import ArrowRightIcon from './icons/ArrowRightIcon';

const NewsItem: React.FC<{ date: string; title: string }> = ({ date, title }) => (
  <li className="mb-4">
    <time className="text-gray-500 dark:text-swa-light-gray text-sm">{date}</time>
    <a href="#" className="block text-swa-green hover:underline font-semibold">{title}</a>
  </li>
);

const NewsAndEvents: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50 dark:bg-swa-dark">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-swa-green pb-2 text-gray-900 dark:text-white">Latest News</h2>
            <ul>
              <NewsItem date="2024-07-20" title="Swalang 1.0.0 is here!" />
              <NewsItem date="2024-07-15" title="The Swa Foundation Welcomes New Members" />
              <NewsItem date="2024-07-05" title="Announcing SwaConf 2024 Keynote Speakers" />
              <NewsItem date="2024-06-28" title="Community Spotlight: Building a Game Engine in Swalang" />
              <NewsItem date="2024-06-19" title="Swalang Survey 2024 Results Are In" />
            </ul>
             <a href="/news" className="text-swa-green font-bold flex items-center hover:underline mt-6">
                More News <ArrowRightIcon className="ml-2 h-5 w-5" />
            </a>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-swa-green pb-2 text-gray-900 dark:text-white">Upcoming Events</h2>
            <ul>
                <NewsItem date="2024-08-01" title="Swa Meetup - Berlin, Germany" />
                <NewsItem date="2024-08-15" title="Webinar: Asynchronous Swalang for Performance" />
                <NewsItem date="2024-09-05" title="Swa User Group - San Francisco, USA" />
                <NewsItem date="2024-09-22" title="EuroSwa 2024 - Paris, France" />
                <NewsItem date="2024-10-10" title="SwaConf 2024 - Virtual Event" />
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsAndEvents;