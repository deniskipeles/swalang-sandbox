import React from 'react';
import Hero from '../Hero';
import InfoCards from '../InfoCards';
import NewsAndEvents from '../NewsAndEvents';
import UseCases from '../UseCases';
import WhySwalang from '../WhySwalang';
import CommunitySections from '../CommunitySections';
import Roadmap from '../Roadmap';

const Home: React.FC = () => {
  return (
    <main>
      <Hero />
      <InfoCards />
      <NewsAndEvents />
      <UseCases />
      <WhySwalang />
      <Roadmap />
      <CommunitySections />
    </main>
  );
};

export default Home;