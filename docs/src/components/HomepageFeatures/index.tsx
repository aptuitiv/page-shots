import type { ReactNode } from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
    title: string;
    Svg: React.ComponentType<React.ComponentProps<'svg'>>;
    description: ReactNode;
};

const FeatureList: FeatureItem[] = [
    {
        title: 'Unopinionated utility styles',
        Svg: require('@site/static/img/undraw_designer_life_re_6ywf.svg')
            .default,
        description: (
            <>
                Cacao is designed to work seamlessly with your custom designs.
                It doesn't impose any design decisions on you.
            </>
        ),
    },
    {
        title: 'Only include what you need',
        Svg: require('@site/static/img/undraw_active_options_re_8rj3.svg')
            .default,
        description: (
            <>
                Each utility style is in a separate file. Only include the ones
                that you need for your website.
            </>
        ),
    },
    {
        title: 'Base styles included',
        Svg: require('@site/static/img/undraw_building_websites_i78t.svg')
            .default,
        description: (
            <>
                Cacao includes some base styles to get you started. Media query
                breakpoints are included, along with reasonable browser reset
                CSS.
            </>
        ),
    },
];

function Feature({ title, Svg, description }: FeatureItem) {
    return (
        <div className={clsx('col col--4')}>
            <div className="text--center">
                <Svg className={styles.featureSvg} role="img" />
            </div>
            <div className="text--center padding-horiz--md">
                <Heading as="h3">{title}</Heading>
                <p>{description}</p>
            </div>
        </div>
    );
}

export default function HomepageFeatures(): ReactNode {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
