import { FaArrowRight, FaMicrosoft } from 'react-icons/fa'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { assets } from '../../assets/assets'
import { HiTrendingUp } from 'react-icons/hi'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { motion } from 'framer-motion'

const services = [
  {
    title: 'Microsoft Azure',
    image: assets.MicrosoftAzure,
    description: 'Cloud computing services'
  },
  {
    title: 'Microsoft 365',
    image: assets.Microsoft365,
    description: 'Productivity cloud suite'
  },
  {
    title: 'Microsoft Teams',
    image: assets.MicrosoftTeams,
    description: 'Collaboration platform'
  },
  {
    title: 'Azure DevOps',
    image: assets.AzureDevOps,
    description: 'Development collaboration'
  },
  {
    title: 'Power BI',
    image: assets.PowerBi,
    description: 'Business analytics'
  },
  {
    title: 'Dynamics 365',
    image: assets.MicrosoftAzure, // Remplace par l'image appropriée
    description: 'Business applications'
  }
]

const PopularServices = () => {
  return (
    <div className="bg-white py-20 px-4 lg:px-20 text-white">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <motion.div 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <HiTrendingUp className="text-white text-2xl" />
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-black">
              Most Popular Services
            </h2>
          </div>
          
          <motion.a
            href="#"
            whileHover={{ x: 5 }}
            className="group flex items-center gap-2 font-medium text-stone-700 hover:text-black transition-all duration-300"
          >
            <span className="transition-all duration-300 group-hover:text-black">
              View All Services
            </span>
            <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </motion.a>
        </div>

        <div className="relative">
          <Swiper
            spaceBetween={30}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 }
            }}
            navigation={{
              nextEl: '.swiper-button-next-custom',
              prevEl: '.swiper-button-prev-custom',
            }}
            pagination={{ 
              clickable: true,
              dynamicBullets: true
            }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            modules={[Navigation, Pagination, Autoplay]}
            className="popular-swiper"
          >
            {services.map((service, index) => (
              <SwiperSlide key={index}>
                <motion.div
                  whileHover={{ y: -10 }}
                  className="group relative rounded-2xl overflow-hidden h-64 cursor-pointer"
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${service.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                    <div className="mb-2">
                      <FaMicrosoft className="text-2xl text-purple-300 mb-2" />
                      <h3 className="text-xl font-semibold mb-1">{service.title}</h3>
                      <p className="text-purple-200 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {service.description}
                      </p>
                    </div>
                    
                    <motion.button 
                      whileHover={{ x: 5 }}
                      className="text-sm text-purple-300 hover:text-white font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      Explore service
                      <FaArrowRight className="text-xs" />
                    </motion.button>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation buttons */}
          <div className="swiper-button-prev-custom absolute left-4 top-1/2 transform -translate-y-1/2 z-10 
                         cursor-pointer text-white text-2xl hover:bg p-3 
                         rounded-full shadow-2xl backdrop-blur-sm transition-all duration-300 hover:scale-110">
            <FiChevronLeft />
          </div>
          <div className="swiper-button-next-custom absolute right-4 top-1/2 transform -translate-y-1/2 z-10 
                         cursor-pointer text-white text-2xl  hover:bg-purple-600 p-3 
                         rounded-full shadow-2xl backdrop-blur-sm transition-all duration-300 hover:scale-110">
            <FiChevronRight />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default PopularServices