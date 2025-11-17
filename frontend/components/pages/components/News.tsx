import React from 'react';
import ArrowRightIcon from './icons/ArrowRightIcon';

// Dummy data for news articles
const newsArticles = [
    {
        date: '2024-07-20',
        title: 'Swalang 1.0.0 is here!',
        excerpt: 'We are thrilled to announce the official release of Swalang 1.0.0. This milestone marks the culmination of years of hard work from our dedicated team and community. Explore the new features, performance improvements, and more.',
        link: '#',
        featured: true,
    },
    {
        date: '2024-07-15',
        title: 'The Swa Foundation Welcomes New Members',
        excerpt: 'The Swa Foundation is excited to welcome three new members to its board, bringing a wealth of experience from across the tech industry to help guide the future of Swalang.',
        link: '#',
    },
    {
        date: '2024-07-05',
        title: 'Announcing SwaConf 2024 Keynote Speakers',
        excerpt: 'Get ready for an incredible lineup at SwaConf 2024! We are proud to announce our keynote speakers who will be sharing their insights on the future of software development.',
        link: '#',
    },
    {
        date: '2024-06-28',
        title: 'Community Spotlight: Building a Game Engine in Swalang',
        excerpt: 'This month, we highlight an amazing community project: a full-featured 2D game engine built from scratch in Swalang. We talked to the creator about their experience.',
        link: '#',
    },
    {
        date: '2024-06-19',
        title: 'Swalang Survey 2024 Results Are In',
        excerpt: 'Thank you to everyone who participated in our annual developer survey. The results are in, and they provide valuable insights into how you use Swalang and what you want to see next.',
        link: '#',
    },
    {
        date: '2024-06-10',
        title: 'New Swalang Tooling for VS Code',
        excerpt: 'The official Swalang extension for Visual Studio Code has been updated with new features, including improved syntax highlighting, IntelliSense, and debugging support.',
        link: '#',
    }
];

const featuredArticle = newsArticles.find(a => a.featured);
const otherArticles = newsArticles.filter(a => !a.featured);


const NewsArticleCard: React.FC<{ article: typeof newsArticles[0] }> = ({ article }) => (
    <div className="bg-white dark:bg-swa-gray p-6 border-b-4 border-swa-green shadow-lg hover:shadow-2xl hover:shadow-swa-green/10 hover:-translate-y-1 transition-all duration-300 flex flex-col">
        <time className="text-gray-500 dark:text-swa-light-gray text-sm mb-2">{article.date}</time>
        <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white flex-grow">{article.title}</h3>
        <p className="mb-4 text-gray-600 dark:text-swa-light-gray">{article.excerpt}</p>
        <a href={article.link} className="text-swa-green font-bold flex items-center hover:underline mt-auto">
            Read More <ArrowRightIcon className="ml-2 h-5 w-5" />
        </a>
    </div>
);


const News: React.FC = () => {
    return (
        <div className="bg-gray-50 dark:bg-swa-dark">
            <div className="container mx-auto px-4 py-16">
                <header className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">News & Announcements</h1>
                    <p className="text-xl text-gray-600 dark:text-swa-light-gray max-w-3xl mx-auto">
                        Stay up-to-date with the latest developments, releases, and stories from the Swalang community.
                    </p>
                </header>

                <main>
                    {/* Featured Article */}
                    {featuredArticle && (
                        <section className="mb-16">
                             <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Featured Story</h2>
                            <a href={featuredArticle.link} className="block bg-white dark:bg-swa-gray p-8 md:p-12 shadow-xl hover:shadow-2xl hover:shadow-swa-green/20 border-l-8 border-swa-green transition-all duration-300 group">
                                <time className="text-gray-500 dark:text-swa-light-gray text-sm mb-2 block">{featuredArticle.date}</time>
                                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white group-hover:text-swa-green transition-colors">{featuredArticle.title}</h3>
                                <p className="text-lg text-gray-600 dark:text-swa-light-gray max-w-3xl">{featuredArticle.excerpt}</p>
                                <span className="text-swa-green font-bold flex items-center hover:underline mt-6">
                                    Read The Announcement <ArrowRightIcon className="ml-2 h-5 w-5" />
                                </span>
                            </a>
                        </section>
                    )}

                    {/* Past Articles */}
                    <section>
                         <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Past Articles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {otherArticles.map(article => (
                                <NewsArticleCard key={article.title} article={article} />
                            ))}
                        </div>
                    </section>
                    
                    {/* Pagination */}
                    <nav className="flex justify-center mt-16" aria-label="Pagination">
                        <a href="#" className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-swa-gray bg-white dark:bg-swa-dark hover:bg-gray-50 dark:hover:bg-swa-gray/80 focus:z-20 focus:outline-offset-0">1</a>
                        <a href="#" className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-swa-gray bg-white dark:bg-swa-dark hover:bg-gray-50 dark:hover:bg-swa-gray/80 focus:z-20 focus:outline-offset-0">2</a>
                        <a href="#" className="relative hidden items-center px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-swa-gray bg-white dark:bg-swa-dark hover:bg-gray-50 dark:hover:bg-swa-gray/80 focus:z-20 focus:outline-offset-0 md:inline-flex">3</a>
                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-swa-gray bg-white dark:bg-swa-dark">...</span>
                        <a href="#" className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-swa-gray bg-white dark:bg-swa-dark hover:bg-gray-50 dark:hover:bg-swa-gray/80 focus:z-20 focus:outline-offset-0">Next</a>
                    </nav>
                </main>
            </div>
        </div>
    );
};

export default News;
