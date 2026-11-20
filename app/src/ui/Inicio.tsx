import { Ilustracao } from './Ilustracao'
import { lerRascunho } from '../store'

export function Inicio() {
  const temRascunho = !!lerRascunho()
  return (
    <div className="pagina">
      <section className="hero">
        <div>
          <h1>A cadeira de rodas do seu cão começa com uma fita métrica.</h1>
          <p className="lead">
            Quatro medidas do seu cão e os materiais que você tem. O Rodante devolve o projeto: modelo 3D, lista de compras, cortes de tubo e as peças para imprimir em 3D.
          </p>
          <div className="acoes">
            <a className="btn btn-primario" href="#/novo">{temRascunho ? 'Continuar projeto' : 'Começar projeto'}</a>
            <a className="btn" href="#/projetos">Meus projetos</a>
          </div>
        </div>
        <Ilustracao medida="todas" />
      </section>

      <h2>Como funciona</h2>
      <ol className="passos-home">
        <li>
          <h3>Meça</h3>
          Com o cão deitado de lado, meça a perna traseira, o comprimento e a largura. Cada medida tem um desenho mostrando onde.
        </li>
        <li>
          <h3>Gere o projeto</h3>
          O quadro é calculado na hora para essas medidas, com alertas quando algo não cabe ou parece arriscado.
        </li>
        <li>
          <h3>Fabrique</h3>
          Baixe o pacote com lista de materiais, cortes, passo a passo de montagem e os arquivos STL das conexões.
        </li>
      </ol>

      <div className="aviso-vet" role="note">
        <strong>Antes de tudo, fale com um veterinário.</strong> A cadeira certa depende do diagnóstico. Uma cadeira traseira serve para fraqueza só nas patas de trás; usada no cão errado, pode piorar o quadro. Este projeto é caseiro, sem teste de laboratório: use com supervisão e revise as peças toda semana.
      </div>
    </div>
  )
}
