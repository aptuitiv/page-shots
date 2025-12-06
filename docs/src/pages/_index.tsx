import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className={clsx('hero hero--primary', styles.heroBanner)}>
            <div className="container">
                <Heading as="h1" className="hero__title">
                    {siteConfig.title}
                </Heading>
                <p className="hero__subtitle">{siteConfig.tagline}</p>
                <div className={styles.buttons}>
                    <Link
                        className="button button--secondary button--lg"
                        to="/get-started"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default function Home(): ReactNode {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout title={siteConfig.title} description={siteConfig.tagline}>
            <HomepageHeader />
            <main>
                <div className="container">
                    <div className="margin-horiz--xl margin-vert--xl">
                        <p>
                            Cacao is a utility class CSS library developed by{' '}
                            <a href="https://www.aptuitiv.com">Aptuitiv</a>. It
                            intentionally does not provide styles for specific
                            components. Rather, it has utility classes for doing
                            common things like grids, setting heights and
                            widths, and gutters.
                        </p>

                        <p>
                            (The `embed` style is the exception to that rule,
                            but it only provides the minimal CSS to responsively
                            embed an iframe.)
                        </p>
                    </div>
                </div>
                <HomepageFeatures />
                <div className="container">
                    <div className="row">
                        <div className="col col--6">
                            <Heading as="h2">Included modules</Heading>
                            <ul>
                                <li>
                                    <a href="/cacao/styles/base">
                                        Reasonable base styles
                                    </a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/reset">
                                        CSS reset styles
                                    </a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/media">
                                        Media query variables
                                    </a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/aspect">
                                        Aspect Ratios
                                    </a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/clearfix">
                                        Clearfix
                                    </a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/display">
                                        Display styles
                                    </a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/embed">
                                        Embed media
                                    </a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/grid">Grid</a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/grid-column">
                                        Grid columns
                                    </a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/gutter">Gutter</a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/height">Height</a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/image">Images</a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/link">Links</a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/margin">Margin</a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/fit">Object fit</a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/padding">Padding</a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/position">
                                        Position
                                    </a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/pull">Pull</a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/push">Push</a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/spacing">Spacing</a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/typography">
                                        Typography
                                    </a>
                                </li>
                                <li>
                                    <a href="/cacao/styles/width">Width</a>
                                </li>
                            </ul>
                        </div>
                        <div className="col col--6">
                            <Heading as="h2">Media query variables</Heading>
                            <p>
                                The included{' '}
                                <a href="/cacao/styles/media">
                                    media query variables
                                </a>{' '}
                                make it easier to consistently use{' '}
                                <a href="/cacao/styles/media#viewport-media-queries">
                                    viewport breakpoints
                                </a>
                                ,{' '}
                                <a href="/cacao/styles/media#accessibility-preferences">
                                    accessibility
                                </a>
                                ,{' '}
                                <a href="/cacao/styles/media#color-preferences">
                                    color
                                </a>
                                ,{' '}
                                <a href="/cacao/styles/media#pointer-types">
                                    pointer
                                </a>
                                , and other media queries
                            </p>
                            <Heading as="h3">Included breakpoints</Heading>
                            <ul>
                                <li>3xs: &gt;= 240px</li>
                                <li>2xs: &gt;= 360px</li>
                                <li>xs: &gt;= 420px</li>
                                <li>sm: &gt;= 576px</li>
                                <li>md: &gt;= 768px</li>
                                <li>lg: &gt;= 1024px</li>
                                <li>xl: &gt;= 1280px</li>
                                <li>2xl: &gt;= 1440px</li>
                                <li>3xl: &gt;= 1600px</li>
                                <li>4xl: &gt;= 1920px</li>
                                <li>5xl: &gt;= 2560px</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </Layout>
    );
}
