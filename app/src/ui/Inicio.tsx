import { Ilustracao } from './Ilustracao'
import { lerRascunho } from '../store'
import { tr } from '../i18n'

export function Inicio() {
  const temRascunho = !!lerRascunho()
  return (
    <div className="pagina">
      <section className="hero">
        <div>
          <h1>{tr('A cadeira de rodas do seu cão começa com uma fita métrica.', "Your dog's wheelchair starts with a tape measure.")}</h1>
          <p className="lead">
            {tr(
              'Algumas medidas do seu cão e os materiais que você tem. O Rodante devolve o projeto: modelo 3D, lista de compras, cortes de tubo e as peças para imprimir em 3D.',
              'A few measurements of your dog and the materials you have. Rodante gives back the design: 3D model, shopping list, tube cuts and the parts to 3D print.',
            )}
          </p>
          <div className="acoes">
            <a className="btn btn-primario" href="#/novo">
              {temRascunho ? tr('Continuar projeto', 'Continue project') : tr('Começar projeto', 'Start a project')}
            </a>
            <a className="btn" href="#/projetos">
              {tr('Meus projetos', 'My projects')}
            </a>
          </div>
        </div>
        <Ilustracao medida="todas" />
      </section>

      <h2>{tr('Como funciona', 'How it works')}</h2>
      <ol className="passos-home">
        <li>
          <h3>{tr('Meça', 'Measure')}</h3>
          {tr(
            'Com o cão deitado de lado, meça as pernas, o comprimento e a largura. Cada medida tem um desenho mostrando onde.',
            'With the dog lying on its side, measure the legs, length and width. Each measurement has a drawing showing where.',
          )}
        </li>
        <li>
          <h3>{tr('Gere o projeto', 'Generate the design')}</h3>
          {tr(
            'Cadeira traseira, dianteira ou de quatro rodas, calculada na hora para essas medidas, com alertas quando algo não cabe ou parece arriscado.',
            'Rear, front or four-wheel cart, computed on the spot for those measurements, with alerts when something does not fit or looks risky.',
          )}
        </li>
        <li>
          <h3>{tr('Fabrique', 'Build it')}</h3>
          {tr(
            'Baixe o pacote com lista de materiais, cortes, passo a passo de montagem e os arquivos STL e STEP das conexões.',
            'Download the package with bill of materials, cuts, step-by-step assembly and the STL and STEP files of the connectors.',
          )}
        </li>
      </ol>

      <div className="aviso-vet" role="note">
        <strong>{tr('Antes de tudo, fale com um veterinário.', 'First of all, talk to a vet.')}</strong>{' '}
        {tr(
          'A cadeira certa depende do diagnóstico. O tipo errado de cadeira pode piorar o quadro. Este projeto é caseiro, sem teste de laboratório: use com supervisão e revise as peças toda semana.',
          'The right cart depends on the diagnosis. The wrong type of cart can make things worse. This is a home-made design, not lab tested: use it under supervision and check the parts every week.',
        )}
      </div>
    </div>
  )
}
