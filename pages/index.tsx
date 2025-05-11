import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, PanInfo } from "framer-motion";
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Montserrat, Playfair_Display } from 'next/font/google';
import Image from 'next/image';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    color: string;
    type: 'circle' | 'line' | 'star';
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      const colors = ['#ffffff', '#ffd700', '#ff69b4', '#87ceeb'];
      const types = ['circle', 'line', 'star'] as const;
      
      for (let i = 0; i < 100; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: Math.random() * 0.5 - 0.25,
          speedY: Math.random() * 0.5 - 0.25,
          opacity: Math.random() * 0.5 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
          type: types[Math.floor(Math.random() * types.length)],
        });
      }
    };

    const drawParticle = (particle: typeof particlesRef.current[0]) => {
      ctx.beginPath();
      ctx.fillStyle = `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
      
      switch (particle.type) {
        case 'circle':
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'line':
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x + particle.size * 2, particle.y + particle.size * 2);
          ctx.strokeStyle = `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = particle.size / 2;
          ctx.stroke();
          break;
        case 'star':
          const spikes = 5;
          const outerRadius = particle.size;
          const innerRadius = particle.size / 2;
          let rot = Math.PI / 2 * 3;
          let x = particle.x;
          let y = particle.y;
          const step = Math.PI / spikes;

          ctx.beginPath();
          ctx.moveTo(x, y - outerRadius);
          for (let i = 0; i < spikes; i++) {
            x = particle.x + Math.cos(rot) * outerRadius;
            y = particle.y + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = particle.x + Math.cos(rot) * innerRadius;
            y = particle.y + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
          }
          ctx.lineTo(particle.x, particle.y - outerRadius);
          ctx.closePath();
          ctx.fill();
          break;
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach((particle) => {
        // Mouse interaction
        const dx = mousePosition.current.x - particle.x;
        const dy = mousePosition.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const angle = Math.atan2(dy, dx);
          const force = (100 - distance) / 100;
          particle.speedX -= Math.cos(angle) * force * 0.02;
          particle.speedY -= Math.sin(angle) * force * 0.02;
        }

        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Bounce off edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Friction
        particle.speedX *= 0.99;
        particle.speedY *= 0.99;

        drawParticle(particle);
      });

      requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    resizeCanvas();
    createParticles();
    animate();

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.4 }}
    />
  );
};

const sectionVariants = {
  hidden: { 
    opacity: 0,
    y: 100,
    scale: 0.95,
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 1,
      ease: [0.6, -0.05, 0.01, 0.99],
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
};

const GallerySection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [imageError, setImageError] = useState<{[key: string]: boolean}>({});
  
  const images = [
    { 
      id: 1, 
      src: "/webpict1.PNG", 
      title: "Land of Mercy", 
      description: "A spiritual journey through the mystical landscapes of Eastern Tibet",
      rotation: -2,
      zIndex: 1
    },
    { 
      id: 2, 
      src: "/webpict2.PNG", 
      title: "Character designs", 
      description: "-",
      rotation: 3,
      zIndex: 2
    },
    // Placeholder for future images
    { 
      id: 3, 
      src: "/placeholder.jpg", 
      title: "Coming Soon", 
      description: "More moments from the film",
      rotation: -1,
      zIndex: 3
    },
    { 
      id: 4, 
      src: "/placeholder.jpg", 
      title: "Coming Soon", 
      description: "Behind the scenes",
      rotation: 2,
      zIndex: 4
    },
    { 
      id: 5, 
      src: "/placeholder.jpg", 
      title: "Coming Soon", 
      description: "Character designs",
      rotation: -3,
      zIndex: 5
    }
  ];

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    if (Math.abs(info.offset.x) > swipeThreshold) {
      if (info.offset.x > 0 && currentIndex > 0) {
        setDirection(-1);
        setCurrentIndex(currentIndex - 1);
      } else if (info.offset.x < 0 && currentIndex < images.length - 1) {
        setDirection(1);
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  const handleImageError = (imageId: number) => {
    setImageError(prev => ({...prev, [imageId]: true}));
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      rotate: direction > 0 ? 15 : -15,
      scale: 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotate: images[currentIndex].rotation,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      rotate: direction < 0 ? 15 : -15,
      scale: 0.8,
    }),
  };

  return (
    <motion.section 
      id="gallery" 
      className="relative py-32 px-6 max-w-7xl mx-auto bg-black text-white"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: "-100px" }}
      variants={sectionVariants}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black pointer-events-none"></div>
      <div className="relative z-10">
        <motion.div 
          className="text-center mb-20"
          variants={itemVariants}
        >
          <motion.h2 
            className="text-5xl md:text-6xl font-bold font-playfair mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Gallery
          </motion.h2>
          <motion.div 
            className="w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto"
            initial={{ width: 0, opacity: 0 }}
            whileInView={{ width: 128, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          ></motion.div>
        </motion.div>

        <div className="relative h-[700px] max-w-4xl mx-auto">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                rotate: { type: "spring", stiffness: 300, damping: 30 },
                scale: { type: "spring", stiffness: 300, damping: 30 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <div className="relative w-full h-full bg-white p-6 rounded-sm shadow-2xl">
                {/* Polaroid Frame */}
                <div className="relative w-full h-full bg-white p-4">
                  {/* Image Area */}
                  <div className="relative w-full h-[80%] overflow-hidden bg-gray-100">
                    {!imageError[images[currentIndex].id] ? (
                      <Image
                        src={images[currentIndex].src}
                        alt={images[currentIndex].title}
                        className="w-full h-full object-cover"
                        width={800}
                        height={600}
                        onError={() => handleImageError(images[currentIndex].id)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <div className="text-center p-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 font-montserrat">Image not available</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Caption Area */}
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-bold font-playfair text-gray-800 mb-1">
                      {images[currentIndex].title}
                    </h3>
                    <p className="text-sm text-gray-600 font-montserrat">
                      {images[currentIndex].description}
                    </p>
                  </div>

                  {/* Vintage Effects */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <motion.button
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 disabled:opacity-30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (currentIndex > 0) {
                setDirection(-1);
                setCurrentIndex(currentIndex - 1);
              }
            }}
            disabled={currentIndex === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>

          <motion.button
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 disabled:opacity-30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (currentIndex < images.length - 1) {
                setDirection(1);
                setCurrentIndex(currentIndex + 1);
              }
            }}
            disabled={currentIndex === images.length - 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>

        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <p className="text-gray-400 font-montserrat mb-4">Swipe or use arrows to navigate</p>
        </motion.div>
      </div>
    </motion.section>
  );
};

const BackToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

const SocialMediaLinks = () => {
  const socialLinks = [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/tibetnovel/',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/@hwallywoodstudio',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  return (
    <motion.div 
      className="fixed bottom-8 left-8 z-50 flex flex-col gap-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      {socialLinks.map((link) => (
        <motion.a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label={`Visit our ${link.name} page`}
        >
          {link.icon}
        </motion.a>
      ))}
    </motion.div>
  );
};

export default function Home() {
  const [showMenu, setShowMenu] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const { scrollYProgress } = useScroll();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Smooth spring animation for mouse movement
  const springConfig = { damping: 25, stiffness: 300 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Handle mouse movement for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX - innerWidth / 2) / 50;
      const y = (clientY - innerHeight / 2) / 50;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      easing: 'ease-in-out',
      mirror: true,
    });
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={`text-white bg-black min-h-screen ${montserrat.variable} ${playfair.variable} overflow-x-hidden`}>
      <ParticleBackground />

      {/* Cursor Trail Effect */}
      <motion.div
        className="fixed w-96 h-96 rounded-full pointer-events-none z-50 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
          x: springX,
          y: springY,
        }}
      />

      {/* Header with enhanced hover effects */}
      <header className="fixed top-8 left-8 right-8 z-50 flex justify-between items-center px-4 py-3">
        <motion.div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => setShowMenu(!showMenu)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="space-y-1.5">
            <motion.div 
              className="w-7 h-[2px] bg-white"
              animate={{ width: showMenu ? 24 : 28 }}
              transition={{ duration: 0.3 }}
            ></motion.div>
            <motion.div 
              className="w-5 h-[2px] bg-white"
              animate={{ width: showMenu ? 28 : 20 }}
              transition={{ duration: 0.3 }}
            ></motion.div>
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.2em] font-montserrat group-hover:text-gray-300 transition-colors duration-300">Menu</span>
        </motion.div>
        <motion.div 
          className="cursor-pointer p-2 hover:bg-white/10 rounded-full transition-colors duration-300"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
          </svg>
        </motion.div>
      </header>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-20 left-12 bg-transparant/200 backdrop-blur-md text-white shadow-2xl px-8 py-6 rounded-lg z-40 border border-white/10"
          >
            <ul className="space-y-4">
              <motion.li 
                whileHover={{ x: 5 }} 
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="group"
              >
                <a href="#news" className="text-lg font-medium hover:text-gray-300 transition-colors duration-200 flex items-center font-montserrat">
                  <span className="w-2 h-2 bg-white rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  News
                </a>
              </motion.li>
              <motion.li 
                whileHover={{ x: 5 }} 
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="group"
              >
                <a href="#cast" className="text-lg font-medium hover:text-gray-300 transition-colors duration-200 flex items-center font-montserrat">
                  <span className="w-2 h-2 bg-white rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Voice Cast
                </a>
              </motion.li>
              <motion.li 
                whileHover={{ x: 5 }} 
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="group"
              >
                <a href="#merch" className="text-lg font-medium hover:text-gray-300 transition-colors duration-200 flex items-center font-montserrat">
                  <span className="w-2 h-2 bg-white rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Merchandise
                </a>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section with enhanced parallax */}
      <section id="home" className="relative h-screen w-full overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            x: useTransform(scrollYProgress, [0, 1], [0, -100]),
            y: useTransform(scrollYProgress, [0, 1], [0, 100]),
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="absolute w-full h-full object-cover"
          >
            <source src="/lom.mp4" type="video/mp4" />
          </video>
        </motion.div>

        {/* Audio Control Button */}
        <motion.button
          onClick={toggleMute}
          className="absolute bottom-8 right-8 z-50 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </motion.button>

        <div className="absolute inset-0 flex items-center justify-center text-center bg-gradient-to-b from-black/80 via-black/50 to-black/80">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto px-4"
          >
            <motion.h1 
              className="text-6xl md:text-7xl font-bold mb-6 font-montserrat tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              style={{
                textShadow: '0 0 20px rgba(255,255,255,0.2)',
              }}
            >
              Land of Mercy
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl font-montserrat tracking-wide max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              A spiritual journey through betrayal, myth, and redemption.
            </motion.p>
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.button
                className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-montserrat tracking-wider transition-all duration-300"
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              >
                Discover More
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center"
          >
            <motion.div
              className="w-1 h-3 bg-white/50 rounded-full mt-2"
              animate={{
                y: [0, 12, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Story Section */}
      <motion.section 
        id="story" 
        className="relative py-32 px-6 max-w-7xl mx-auto bg-black text-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, margin: "-100px" }}
        variants={sectionVariants}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black pointer-events-none"></div>
        <div className="relative z-10">
          <motion.div 
            className="text-center mb-20"
            variants={itemVariants}
          >
            <motion.h2 
              className="text-5xl md:text-6xl font-bold font-playfair mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              The Story
            </motion.h2>
            <motion.div 
              className="w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto"
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: 128, opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            ></motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              className="space-y-8"
              variants={itemVariants}
            >
              <motion.p 
                className="text-gray-300 font-montserrat leading-relaxed text-lg"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Land of Mercy is a magical intriguing tale of love, greed, betrayal, sacrifice and spiritual quest. The story sees a young man embark on a quest for enlightenment that was the last wish of his dying father.
              </motion.p>
              <motion.p 
                className="text-gray-300 font-montserrat leading-relaxed text-lg"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Set in 1950s, the conflict starts between two prominent families living beneath the snow mountain of Eastern Tibet and ends in a journey in pursuit of personal salvation, self-worth and enlightenment.
              </motion.p>
            </motion.div>

            <motion.div 
              className="space-y-8"
              variants={itemVariants}
            >
              <motion.p 
                className="text-gray-300 font-montserrat leading-relaxed text-lg"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                The film is based on the fiction novel written by Fan Wen. Steeped in the magical lore of Tibetan Buddhism, the story takes readers into a world of magic and mystery where there are no limits to human capability and where legend, myth and history intertwine and enthrall.
              </motion.p>
              <motion.div 
                className="relative p-8 rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent rounded-lg"></div>
                <p className="text-gray-200 font-montserrat italic text-lg relative z-10">
                  &quot;A journey of self-discovery through the mystical landscapes of Eastern Tibet&quot;
                </p>
              </motion.div>
            </motion.div>
          </div>

          <motion.div 
            className="mt-20 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <motion.div 
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a href="#merch" className="inline-flex items-center px-8 py-4 border border-white/20 rounded-full text-white font-montserrat tracking-wider hover:bg-white/10 transition-colors duration-300">
                <span>Discover More</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* News Section */}
      <motion.section 
        id="news" 
        className="relative py-32 px-6 max-w-7xl mx-auto bg-black text-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, margin: "-100px" }}
        variants={sectionVariants}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black pointer-events-none"></div>
        <div className="relative z-10">
          <motion.div 
            className="text-center mb-20"
            variants={itemVariants}
          >
            <motion.h2 
              className="text-5xl md:text-6xl font-bold font-playfair mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Latest News
            </motion.h2>
            <motion.div 
              className="w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto"
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: 128, opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            ></motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl backdrop-blur-sm border border-white/10 group-hover:border-white/20 transition-all duration-300"></div>
              <div className="relative p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-2 bg-white/10 rounded-full text-sm font-montserrat tracking-wider">Production</span>
                  <span className="text-gray-400 text-sm">July 2022</span>
                </div>
                <h3 className="text-2xl font-bold font-playfair">Voice Cast Announced</h3>
                <p className="text-gray-300 font-montserrat leading-relaxed">
                  The film features an impressive voice cast including Armand Assante (HBO&apos;s &quot;Gotti&quot;), Alexander Wraith (&quot;The Mandalorian&quot;), and Louis Mandylor (&quot;Debt Collector&quot;), bringing the characters to life in this epic tale.
                </p>
                <div className="pt-4">
                  <a href="https://variety.com/2022/film/asia/tibet-animation-film-land-of-mercy-armand-assante-alexander-wraith-1235313248/" 
                     className="inline-flex items-center text-sm font-medium border-b border-white/20 group-hover:border-white transition-colors duration-300">
                    <span className="mr-2 group-hover:translate-x-1 transition-transform">Read More</span>
                    <span className="text-xl">→</span>
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl backdrop-blur-sm border border-white/10 group-hover:border-white/20 transition-all duration-300"></div>
              <div className="relative p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-2 bg-white/10 rounded-full text-sm font-montserrat tracking-wider">Development</span>
                  <span className="text-gray-400 text-sm">2022</span>
                </div>
                <h3 className="text-2xl font-bold font-playfair">Production Details</h3>
                <p className="text-gray-300 font-montserrat leading-relaxed">
                  The $3 million animated feature is written, directed, and produced by Tan Keng Leck of Singapore&apos;s Hwallywood Studio, adapted from Fan Wen&apos;s acclaimed novel. Animation production is handled by Indonesia&apos;s MSV.
                </p>
                <div className="pt-4">
                  <a href="https://www.imdb.com/title/tt21257852/" 
                     className="inline-flex items-center text-sm font-medium border-b border-white/20 group-hover:border-white transition-colors duration-300">
                    <span className="mr-2 group-hover:translate-x-1 transition-transform">View on IMDb</span>
                    <span className="text-xl">→</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <motion.div 
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a href="#cast" className="inline-flex items-center px-8 py-4 border border-white/20 rounded-full text-white font-montserrat tracking-wider hover:bg-white/10 transition-colors duration-300">
                <span>Meet the Cast</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Voice Cast Section */}
      <motion.section 
        id="cast" 
        className="relative py-32 px-6 max-w-7xl mx-auto bg-black text-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, margin: "-100px" }}
        variants={sectionVariants}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black pointer-events-none"></div>
        <div className="relative z-10">
          <motion.div 
            className="text-center mb-20"
            variants={itemVariants}
          >
            <motion.h2 
              className="text-5xl md:text-6xl font-bold font-playfair mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Voice Cast
            </motion.h2>
            <motion.div 
              className="w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto"
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: 128, opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            ></motion.div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { actor: "Alexander Wraith", role: "Alashi" },
              { actor: "Ani Choying Dolma", role: "Yangchen" },
              { actor: "Adrian Pang", role: "Steward Tsering / Old Khampa Villager" },
              { actor: "Armand Assante", role: "Gongba Tulku" },
              { actor: "Brain Bekkerman", role: "Lama Sonam / Male Servant" },
              { actor: "Christopher Attianese", role: "Karmapa" },
              { actor: "Datok Ngawang", role: "Youdan / Tashi Dudjom" },
              { actor: "Dewi Tan", role: "Yesang Dawa" },
              { actor: "James Laver", role: "King Yegong" },
              { actor: "Jeremy Linn", role: "Khenpo Chungpo / Commander Wang" },
              { actor: "Lobsang Tenzin Meindrukbhuk", role: "Kunga / Geshe Gyalwu / Old Man with Mala" },
              { actor: "Louis Mandylor", role: "Dagpo Dorje" },
              { actor: "Mia Christo", role: "Drolma / Longchen / Shu Ling / Female Servant" },
              { actor: "Peter Bekkerman", role: "Lord Yama" },
              { actor: "Salden Kunga", role: "Chief Bandit" },
              { actor: "Sebastian Galvan", role: "Garwang / PLA Soldier" },
              { actor: "Shenpenn Khymsar", role: "Chief Pema / Lord Tashi / Lama Zhalu / Dudjom / Norbu / PLA Soldier" },
              { actor: "Tara Sibel", role: "Pechu" },
              { actor: "Tulku Jamyang Kunga Tenzin", role: "Lama Rinchen / Angin" },
              { actor: "Wanna Choy", role: "Migmela" }
            ].map((cast, index) => (
              <motion.div
                key={cast.actor}
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl backdrop-blur-sm border border-white/10 group-hover:border-white/20 transition-all duration-300"></div>
                <div className="relative p-6 space-y-2">
                  <h3 className="text-xl font-bold font-playfair text-white group-hover:text-gray-200 transition-colors duration-300">
                    {cast.actor}
                  </h3>
                  <p className="text-gray-400 font-montserrat text-sm">
                    {cast.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="mt-20 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <motion.div 
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a href="#merch" className="inline-flex items-center px-8 py-4 border border-white/20 rounded-full text-white font-montserrat tracking-wider hover:bg-white/10 transition-colors duration-300">
                <span>Explore Merchandise</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Merchandise Section */}
      <motion.section 
        id="merch" 
        className="relative py-32 px-6 max-w-7xl mx-auto bg-black text-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, margin: "-100px" }}
        variants={sectionVariants}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black pointer-events-none"></div>
        <div className="relative z-10">
          <motion.div 
            className="text-center mb-20"
            variants={itemVariants}
          >
            <motion.h2 
              className="text-5xl md:text-6xl font-bold font-playfair mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Merchandise
            </motion.h2>
            <motion.div 
              className="w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto"
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: 128, opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            ></motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Animals Print */}
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl backdrop-blur-sm border border-white/10 group-hover:border-white/20 transition-all duration-300"></div>
              <div className="relative p-8 space-y-6">
                <div className="aspect-w-3 aspect-h-4 rounded-lg overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                  <Image
                    src="/Merch1.avif"
                    alt="Land of Mercy Animals Print"
                    className="w-full h-full object-cover"
                    width={800}
                    height={1067}
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold font-playfair">Land of Mercy Animals Print</h3>
                  <p className="text-gray-300 font-montserrat">Black Cotton</p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Available Sizes:</h4>
                    <div className="space-y-1">
                      <p className="text-gray-300 font-montserrat">M (Shoulder 17&quot;/Chest 40&quot;/Length 28&quot;)</p>
                      <p className="text-gray-300 font-montserrat">XL (Shoulder 24&quot;/Chest 48&quot;/Length 29&quot;)</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Yama Messenger Print */}
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl backdrop-blur-sm border border-white/10 group-hover:border-white/20 transition-all duration-300"></div>
              <div className="relative p-8 space-y-6">
                <div className="aspect-w-3 aspect-h-4 rounded-lg overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                  <Image
                    src="/Merch2.avif"
                    alt="Land of Mercy Yama Messenger Print"
                    className="w-full h-full object-cover"
                    width={800}
                    height={1067}
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold font-playfair">Land of Mercy Yama Messenger Print</h3>
                  <p className="text-gray-300 font-montserrat">Black Cotton</p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Available Sizes:</h4>
                    <div className="space-y-1">
                      <p className="text-gray-300 font-montserrat">M (Shoulder 17&quot;/Chest 40&quot;/Length 28&quot;)</p>
                      <p className="text-gray-300 font-montserrat">XL (Shoulder 24&quot;/Chest 48&quot;/Length 29&quot;)</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="mt-20 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <div className="max-w-2xl mx-auto space-y-6">
              <motion.p 
                className="text-xl font-montserrat text-gray-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                Interested in placing an order?
              </motion.p>
              <motion.a 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowContactForm(true);
                }}
                className="inline-flex items-center px-8 py-4 border border-white/20 rounded-full text-white font-montserrat tracking-wider hover:bg-white/10 transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Contact Us</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Add Gallery Section before the Contact Form */}
      <GallerySection />

      {/* Contact Form Modal */}
      <AnimatePresence>
        {showContactForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-black border border-white/10 rounded-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
              <div className="relative p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-3xl font-bold font-playfair mb-2">Contact Us</h3>
                    <p className="text-gray-400 font-montserrat">
                      Have a question? Feel free to contact us for any inquiries regarding our films, events, or merchandise.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowContactForm(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  window.location.href = `mailto:Hwallywoodstudio@gmail.com?subject=${encodeURIComponent(formData.get('subject') as string)}&body=${encodeURIComponent(`Name: ${formData.get('name')}\n\nMessage: ${formData.get('message')}`)}`;
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/20 transition-colors duration-200 font-montserrat"
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/20 transition-colors duration-200 font-montserrat"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/20 transition-colors duration-200 font-montserrat"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/20 transition-colors duration-200 font-montserrat resize-none"
                    ></textarea>
                  </div>
                  <div className="flex justify-end">
                    <motion.button
                      type="submit"
                      className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-montserrat tracking-wider transition-colors duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Send Message
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <BackToTopButton />
      <SocialMediaLinks />
    </div>
  );
}
