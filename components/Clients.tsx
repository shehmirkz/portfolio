import React from 'react'
import { InfiniteMovingCards } from './ui/InfiniteMovingCards'
import { companies, testimonials } from '@/data'

const Clients = () => {
    return (
        <div className='py-20' id='testimonials'>
            <h1 className='heading mb-10'>
                Kind words from
                <span className='text-purple'> Satisfied Clients</span>
            </h1>
            <div className='flex flex-col items-center max-lg:mt-10'>

                <InfiniteMovingCards
                    items={testimonials}
                    direction='right'
                    speed='slow'
                />
                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-16 max-lg:mt-10">
                    {companies.map(({ id, img, name }) => (
                        <div
                            key={id}
                            className="flex flex-col items-center justify-center md:max-w-40 max-w-32"
                        >
                            <img
                                src={img}
                                alt={name}
                                className="md:w-24 w-16 object-contain transition-transform duration-300 hover:scale-105"
                            />

                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Clients