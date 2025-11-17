import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/pages/Home';
import Docs from './components/pages/Docs';
import GettingStarted from './components/GettingStarted';
import Downloads from './components/Downloads';
import Careers from './components/Careers';
import News from './components/News';
import About from './components/pages/About';
import Try from './components/pages/Try';

const App: React.FC = () => {
  const path = window.location.pathname;

  let page;
  switch (path) {
    case '/docs':
      page = <Docs />;
      break;
    case '/getting-started':
      page = <GettingStarted />;
      break;
    case '/downloads':
      page = <Downloads />;
      break;
    case '/careers':
      page = <Careers />;
      break;
    case '/news':
      page = <News />;
      break;
    case '/about':
      page = <About />;
      break;
    case '/try':
      page = <Try />;
      break;
    case '/':
    default:
      page = <Home />;
      break;
  }

  return (
    <div className="text-gray-700 dark:text-gray-300 font-sans">
      <Header />
      {page}
      <Footer />
    </div>
  );
};

export default App;